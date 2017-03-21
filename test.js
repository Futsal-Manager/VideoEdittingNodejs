/**
 * Created by yuhogyun on 2017. 3. 7..
 */

/**
 * Todo:
 * 1. 영상편집 효과(확대, 축소, fadein, fadeout, 자막, 메인그림 삽입)
 * 2. 음악을 자동으로 골라주어야함 => 유져가 선택할 수 있도록 하는건 어떨까? NCS중에 선택.
 * 3. Exception: 영상보다 시간이 긴 경우, 영상이 아닌경우  => 음악이 영상보다 긴 경우 음악을 잘라줌(duration 설정).
 *
 */

let ffmpeg = require('fluent-ffmpeg');
let Promise = require('bluebird');

/**
 * CONSTANT FOR STATUS
 */
const PROCESSING_TYPE = {
    SPLIT_VIDEO: 'SPLIT Video',
    MERGE_VIDEO: 'Merge Video',
    INPUT_MUSIC: 'INPUT MUSIC',
};

/**
 * Default Parameter1. Split Time Array
 * @type {string}
 */
let originalFilePath = 'test.mov';

/**
 * Default Parameter2. Split Time Array
 * This is Array for parameter. go and node server communicate with this parameters.
 * @type {[*]}
 */
let timeArr = [
    {
        startAt: '00:30',
        duration: '00:20'
    },
    {
        startAt: '01:00',
        duration: '00:30'
    }
];

/**
 * Default Parameter3. Output File Path
 * @type {string}
 */
let outputFilePath = 'highlight.mp4';

/**
 * Default Parameter4. Skip Input Time
 * @type {string}
 */
let skipInputTime = '01:00';

// Excecute Main function for demo
extractHighlight(originalFilePath, timeArr, outputFilePath, skipInputTime);

// Main Function
/**
 * Main Function For Video Editing
 * @param filePath
 * @param timeArr
 * @param outputPath
 * @param skipTime
 */
function extractHighlight(filePath, timeArr, outputPath, skipTime) {

    // Promise chain으로 되어야 함
    /**
     * Processing Order
     * 1. split (v)
     * 2. merge video (v)
     * 3. add music (v)
     * 4. add fadeOut, fadeIn (x)
     */

    // Todo: 음악을 자동으로 골라주어야함 => 유져가 선택할 수 있도록 하는건 어떨까? NCS중에 선택.
    let selectedMusic = './bgm.mp3';

    // Progress 1. split
    splitVideo(filePath, timeArr, skipTime).then((splittedFilePathArr) => {
        let mergedPath = './merged.mp4';
        // Progress 2. merge video
        return mergeVideo(splittedFilePathArr, mergedPath);
    }).then((mergedFile) => {
        // Progress 3. add music
        return inputMusic(mergedFile, selectedMusic, outputPath);
    }).then((musicVideo) => {
        // log musicVideo path
        console.log('music video path is', musicVideo);
    }).catch((err) => {
        console.log('catch error: ', err);
    })
};

/**
 * jiiii
 * @param originalVideoPath: Split할 Video Path
 * @param timeArr: 시작시간, duration이 있는 배열
 * @param skipTime: 생량할 앞부분의 시간
 * @returns {*}
 */
function splitVideo(originalVideoPath, timeArr, skipTime = 0) {
    return new Promise((resolve, reject) => {
        let fileNameArr = [];

        // File name is unixDate + file Index + '.mp4'
        timeArr.forEach((key, index) => {
            fileNameArr.push(Date.now() + 'index' + index + '.mp4')
        });

        let outputFFmpeg =
            ffmpeg(originalVideoPath)
                .seekInput(skipTime); // skipTime ex) '1:00'

        // split video with time and duration.
        for(let i=0; i < fileNameArr.length; i++) {
            outputFFmpeg = _addDurationOutput(outputFFmpeg, fileNameArr[i], timeArr[i].startAt, timeArr[i].duration);
        }

        // ADD ON PROGRESS EVENT
        let addedProgressEvent = _addOnProgress(outputFFmpeg);
        // ADD ON ERROR EVENT
        let addedErrorEvent = _addOnErrorEvent(addedProgressEvent, reject);
        // ADD ON END EVENT
        let addedEndEvent = _addOnEndEvent(addedErrorEvent, PROCESSING_TYPE.SPLIT_VIDEO, resolve, fileNameArr);

        addedEndEvent.run();
    })
}

/**
 * Progress 2. Merge the splitted Video
 * @param splittedPathArr
 * @param outputPath
 * @returns {*}
 */
function mergeVideo(splittedPathArr, outputPath) {
    return new Promise((resolve, reject) => {
        let outputFfmpeg = ffmpeg();

        for(let i = 0; i < splittedPathArr.length; i++) {
            outputFfmpeg = _addInput(outputFfmpeg, splittedPathArr[i]);
        }

        // ADD ON PROGRESS EVENT
        let addedProgressEvent = _addOnProgress(outputFfmpeg);
        // ADD ON ERROR EVENT
        let addedErrorEvent = _addOnErrorEvent(addedProgressEvent, reject);
        // ADD ON END EVENT
        let addedEndEvent = _addOnEndEvent(addedErrorEvent, PROCESSING_TYPE.MERGE_VIDEO, resolve, outputPath);

        // execute merge, don't need to run() command. it executed directly
        addedEndEvent.mergeToFile(outputPath, './tempDir');
    })
}

/**
 * Progress 3. Input Music
 * @param splittedPathArr
 * @param outputPath
 * @returns {*}
 */
function inputMusic(filePathArr, musicPath, outputPath) {
    return new Promise((resolve, reject) => {
        let musicVideo = ffmpeg()
            .input(filePathArr)
            .addInput(musicPath);

        // ADD ON PROGRESS EVENT
        let addedProgressEvent = _addOnProgress(musicVideo);
        // ADD ON ERROR EVENT
        let addedErrorEvent = _addOnErrorEvent(addedProgressEvent, reject);
        // ADD ON END EVENT
        let addedEndEvent = _addOnEndEvent(addedErrorEvent, PROCESSING_TYPE.INPUT_MUSIC, resolve, outputPath);

        // execute input misic, don't need to run() command. it executed directly
        addedEndEvent.save(outputPath);
    })
}


/**
 * Input file for 1. Split video
 * @param _ffmpeg
 * @param _filePath
 * @returns {*}
 */
function _addInput(_ffmpeg,_filePath) {
    return _ffmpeg
        .input(_filePath);
}

/**
 * Duration output for 1. Split video
 * @param _ffmpeg
 * @param _fileName
 * @param _startAt
 * @param _duration
 * @returns {*}
 */
function _addDurationOutput(_ffmpeg, _fileName, _startAt, _duration) {
    return _ffmpeg
        .output(_fileName)
        .seek(_startAt)
        .duration(_duration)
}

/**
 * Progress Event Handler for ffmpeg Progress 1,2,3
 * @param _ffmpeg
 * @returns {*}
 */
function _addOnProgress(_ffmpeg) {
    return _ffmpeg.on('progress', function(progress) {
        // console.log('Processing: ' + progress.percent + '% done');
    })
}

/**
 * End Event handler for ffmpeg Progress 1,2,3
 * @param _ffmpeg
 * @param processingType
 * @param resolve
 * @param resolvePath
 * @returns {*}
 */
function _addOnEndEvent(_ffmpeg, processingType, resolve, resolvePath) {
    return _ffmpeg.on('end', function() {
        console.log('End Prosessing for ' + processingType);
        resolve(resolvePath);
    })
}

/**
 * Error Event handler for ffmpeg Progress 1,2,3
 * @param _ffmpeg
 * @param reject
 * @returns {*}
 */
function _addOnErrorEvent(_ffmpeg, reject) {
    return _ffmpeg.on('error', function(err) {
        console.log('error occurred' + err.message);
        reject(err);
    })
}
