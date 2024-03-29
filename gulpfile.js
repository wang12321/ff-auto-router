var gulp = require('gulp');
const uglify = require('gulp-uglify');
var bump = require('gulp-bump');

gulp.task('js', function () {
    return gulp.src('./bin/*.js') // read all
        .pipe(uglify())
        .pipe(gulp.dest('./lib'));
});

gulp.task('bump',function(){
    return gulp.src('./package.json')
        .pipe(bump({type:'patch'}))
        .pipe(gulp.dest('./'));
});

gulp.task('default', gulp.series('js','bump'));

