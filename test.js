/**
 * Created by yuhogyun on 2017. 3. 7..
 */

let ffmpeg = require('fluent-ffmpeg');

trimVideo('test.mov', '0:30', '2:00');

// Lambda에 올릴까

function trimVideo(filePath, beginTime, duration) {
    ffmpeg(filePath)
        .setStartTime(beginTime)
        .setDuration(duration)
        .addInput('./bgm.mp3')
        .on('progress', function(progress) {
            console.log('Processing: ' + progress.percent + '% done');
        })
        .on('error', function(err) {
            console.log('An error occurred: ' + err.message);
        })
        .on('end', function() {
            console.log('Merging finished !');
        })
        .save('./output.mp4');
};
