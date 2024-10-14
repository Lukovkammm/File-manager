import readline from 'node:readline';
import os from 'node:os';
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { existsSync, createReadStream } from 'node:fs';

const rootDir = os.homedir();
let currentDir = rootDir;

const getUserName = () => {
    const argv = process.argv;
    const targetArg = argv.filter((arg) => arg.toLowerCase().startsWith('--username'))[0];
    if (targetArg) {
        const username = targetArg.split('=')[1];
        return username;
    }

    process.stderr.write('Username not provided. Please provide a username using --username argument.\n');
    process.exit(1);
}

const printCurrentDirectory = () => {
    process.stdout.write(`You are currently in ${currentDir}\n`);
}

const isAboveRoot = (targetPath) => {
    const relative = path.relative(rootDir, targetPath);
    return relative.startsWith('..') || path.isAbsolute(relative) && !relative.startsWith('.');
}

const handleUpCommand = () => {
    handleCdCommand('../');
}

const handleCdCommand = (targetPath) => {
    if (!targetPath) {
        process.stdout.write('Operation failed!');
        return;
    }

    if (path.isAbsolute(targetPath)) {
        targetPath = path.resolve(currentDir, targetPath);
    } else {
        targetPath = path.join(currentDir, targetPath);
    }

    if (!existsSync(targetPath)) {
        console.log('Invalid input\n');
        return;
    }

    if (isAboveRoot(targetPath)) {
        process.stdout.write('Operation failed!\n');
        return;
    }

    currentDir = targetPath;
}

const handleLsCommand = async () => {
    try {
        const data = await readdir(currentDir, { withFileTypes: true })
        const result = data.reduce((acc, curr) => {
            const baseArr = [];
            baseArr.push(curr.name, curr.isFile() ? 'file' : 'directory')
            acc.push(baseArr);
            return acc;
        }, []);
        console.table(result)
    } catch (err) {
        console.log('Operation failed!')
    }
}

const handleCatCommand = (targetPath) => {
    targetPath = path.resolve(currentDir, targetPath);
    createReadStream(targetPath).pipe(process.stdout);
}

const completer = (line) => {
    const completions = '.exit .quit .q'.split(' ');
    const hits = completions.filter((c) => c.startsWith(line));
    if (hits.length) process.exit(0);
}


const fileManagerApp = () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const username = getUserName();
    process.stdout.write(`Welcome to the File Manager, ${username}!\n`);
    printCurrentDirectory();

    rl.on('line', (command) => {
        completer(command);

        if (command.startsWith('cd')) {
            const path = command.split(' ')[1];
            handleCdCommand(path);
        }

        if (command.startsWith('cat')) {
            const path = command.split(' ')[1];
            handleCatCommand(path);
        }

        switch (command) {
            case 'up':
                handleUpCommand();
                break;

            case 'ls':
                handleLsCommand();
                break;

            default:
                break;
        }

        printCurrentDirectory()
    })

    rl.on('close', () => {
        console.log(`\nThank you for using File Manager,  ${username}, goodbye!`);
    })

}

fileManagerApp();


