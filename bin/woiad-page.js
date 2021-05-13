#!/usr/bin/env node
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..')) /**
 require.resolve(id) 获取传入参数的模块的路径
 ..,会在当前根目录当中自动去package.json中寻找 main 对应的文件
 */
process.argv.push('--cwd') // process.argv 命令行当中的参数
process.argv.push(process.cwd()) // 执行命令时的工作路径
require('gulp/bin/gulp')
