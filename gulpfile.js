// 載入 gulp 相關的 module
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var batch = require('gulp-batch');
var clean = require('gulp-rimraf');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var livereload = require('gulp-livereload');
var notify = require('gulp-notify');
var fs = require('fs');

// 環境變數
var env = 'prod'; // dev||prod

// var live = livereload();
// livereload.listen();

// 路徑變數
var paths = {
    main: './app/app.js',
    src: 'app/**/*',
    destDir: 'build',
    testScrips: 'test/**/*.js'
};

/**
 *  打包 js,
 */
gulp.task('bundle-js', function() {

    // console.log( '\nbundle-js 跑' );

    //    return browserify().add(paths.main)
    //
    //    // 所有檔案合併為一
    //    .bundle({
    //        debug: false
    //    })
    //
    //    .on('error', function (err) {
    //        console.log('[錯誤]', err);
    //        this.end();
    //        gulp.src('').pipe(notify('✖ Bunlde Failed ✖'));
    //    })
    //
    //    // 利用 vinyl-source-stream 幫檔案取名字
    //    .pipe(source('bundle.js'))
    //
    //    // 接著就回到 gulp 系統做剩下事
    //    // 這裏是直接存檔到硬碟
    //    .pipe(gulp.dest('./build'));
    gulp.src(paths.src)
        .pipe(gulp.dest(paths.destDir));

});

/**
 * 監控 app/ 下所有 js, jsx, html, css 變化就重新編譯
 */
gulp.task('watch', function() {
    // console.log( 'watch 跑' );

    gulp.watch(paths.src, ['clean', 'bundle-js', 'refresh']);

    //gulp.watch(['test/**', 'app/lib/**'], ['test']);
});

/**
 * livereload refresh
 */
gulp.task('refresh', function() {
    // console.log( '\nlivereload > refresh\n' );
    setTimeout(function() {
        live.changed('');
    }, 500);
});

gulp.task('clean', function() {
    return gulp.src(paths.destDir + '/**/*', {
            read: false
        })
        .pipe(clean());
});

gulp.task('test', function() {
    return gulp.src([paths.testScrips])
        .pipe(mocha())
        .on('error', function(err) {
            console.log('======');
            console.log('[測試錯誤]', err);
        });
});

//========================================================================
//
// 總成的指令集

/**
 * 初期讓 default 就是跑 dev task，將來可能會改成有 build, deploy 等花樣
 */
gulp.task('default', ['dev']);

/**
 * 廣播 livereload 事件
 */
gulp.task('dev', ['clean', 'bundle-js', 'watch']);
//
//gulp.task('default', function () {
//    //     return gulp.src('test/**/*.js', {
//    //             read: false
//    //         })
//    //         .pipe(mocha({
//    //             reporter: 'list'
//    //         }));
//
//});
