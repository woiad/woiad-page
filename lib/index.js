const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del')
const browserSync = require('browser-sync')
const path = require('path')
const loadPlugins = require('gulp-load-plugins') // 自动加在 gulp 的插件

const plugins = loadPlugins()
const bs = browserSync.create()
const cwd = process.cwd() // 获取执行命令时所在的路径
let config = {
  // default config
  build: {
    src: 'src',
    dist: 'dist',
    tmp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}

try {
  const loadConfig = require(path.join(cwd, 'pages.config.js'))
  config = Object.assign({}, config, loadConfig)
} catch (e) {}

const clean = () => {
  return del([config.build.dist, config.build.tmp]) // 删除文件
}

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src }) // base 基准路径，保留src后面的目录结构, cwd 从哪个文件夹开始寻找文件
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.tmp))
}

const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.tmp))
}

const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data, cache: false }))
    .pipe(dest(config.build.tmp))
}

const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style) // 监听 scss 文件改变
  watch(config.build.paths.scripts, { cwd: config.build.src }, script) // 监听 .js 文件改变
  watch(config.build.paths.pages, { cwd: config.build.src }, page) // 监听 .html 页面改变
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  watch([ // 监听文件的改变，然后调用 bs 刷新页面
    config.build.paths.images,
    config.build.paths.fonts,
    config.build.public
  ], { cwd: config.build.src }, bs.reload)

  watch('**', { cwd: config.build.public }, bs.reload)

  bs.init({
    notify: false,
    port: 2080,
    files: path.join(config.build.tmp, '**'), // 监听 tmp 下的目录，一旦发生变化，自动刷新页面
    server: {
      baseDir: [config.build.tmp, config.build.src, config.build.public], // 静态文件存放的基础路径
      routes: { // 优先匹配 routes ,在匹配 baseDir;开启一个路由把匹配的文件链接到本地对应的目录下的文件
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => { // 把构建注释里面的文件打包成一个文件，并且把构建注释去掉
  return src(config.build.paths.pages, { base: config.build.tmp, cwd: config.build.tmp })
    .pipe(plugins.useref({ searchPath: [config.build.tmp, '.'] })) // 要打包的文件路径
    // html js css 打包压缩
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(config.build.dist))
}

const compile = parallel(style, script, page)

// 上线之前执行的任务
const build = series(clean, parallel(series(compile, useref), image, font, extra))

const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop
}
