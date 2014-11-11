var gulp = require('gulp');
var mocha = require('gulp-mocha');
var batch = require('gulp-batch');

gulp.task('default', function() {
    //     return gulp.src('test/**/*.js', {
    //             read: false
    //         })
    //         .pipe(mocha({
    //             reporter: 'list'
    //         }));

    gulp.watch(['test/**', 'lib/**'], batch(function(events, cb) {
        return gulp.src(['test/**/*.js'])
            .pipe(mocha({
                reporter: 'list'
            }))
            .on('error', function(err) {
                console.log(err.stack);
            });
    }));

});
