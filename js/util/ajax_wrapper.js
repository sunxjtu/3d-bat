/* The alternatives of ajax functions for the stand alone version.
 *
 */

let __labelData = [];


function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function request(options) {
    if (options.type === "GET") {
        let responseDict;
        let res;
        switch (options.url) {
            case "/labels/":
                responseDict = {
                    blob: "input",
                    progress: 102
                };
                res = {responseText: JSON.stringify([responseDict])};
                options.complete(res);
                break;
            case "/label/image_size/":
                if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
                    responseDict = {
                        width: 320,
                        height: 240
                        // width: 640,
                        // height: 480
                    };
                } else {
                    responseDict = {
                        width: 320,
                        height: 180
                        // width: 640,
                        // height: 360
                    };
                }

                res = {responseText: JSON.stringify(responseDict)};
                options.complete(res);
                break;
            case "/label/file_names/":
                let numFiles;
                if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
                    numFiles = 900;
                } else {
                    numFiles = 3962;
                }

                let fileNameArray = [];
                for (let i = 0; i < numFiles; i++) {
                    fileNameArray.push(pad(i, 6))
                }
                responseDict = {
                    file_names: fileNameArray
                };
                res = {responseText: JSON.stringify(responseDict)};
                options.complete(res);
                break;
            case "/label/annotations/":
                let fileName = options.data["file_name"];
                res = [];
                if (labelTool.loadNuScenesLabels === true) {
                    for (let channelObj in labelTool.camChannels) {
                        if (labelTool.camChannels.hasOwnProperty(channelObj)) {
                            let channelObject = labelTool.camChannels[channelObj];
                            let channel = channelObject.channel;
                            // if (fileName in __labelData) {
                            //     res = JSON.parse(__labelData[fileName]);
                            // } else {
                            let resChannel = parseAnnotationFile(fileName, channel);
                            let loadedChannelObj = {channel: channel, content: resChannel};
                            res.push(loadedChannelObj);
                            // }
                        }

                    }

                } else {
                    // if (fileName in __labelData) {
                    //     res = JSON.parse(__labelData[fileName]);
                    // } else {
                    res = parseAnnotationFile(fileName, undefined);
                    // }
                }

                options.success(res);
                break;
        }
    } else if (options.type === "POST") {
        switch (options.url) {
            case "/label/annotations/":
                /* if (options.data["label_id"] == 2) {*/
                __labelData[options.data["file_name"]] = options.data["annotations"];
                options.success("None");
                /* } else {
                   options.error();
                   }*/
                break;
        }
    }
}

function annotationFileExist(fileIndex, channel) {
    let url;
    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
        url = labelTool.workBlob + '/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/annotations/' + labelTool.fileNames[fileIndex] + '.txt';
    } else {
        if (labelTool.loadNuScenesLabels === true) {
            // load already created annotations provided by NuScenes
            url = labelTool.workBlob + '/' + labelTool.currentDataset + '/Annotations/' + channel + '/' + labelTool.fileNames[fileIndex] + '.txt';
        } else {
            // load annotations from user
            url = labelTool.workBlob + '/' + labelTool.currentDataset + '/Annotations_test/' + labelTool.fileNames[fileIndex] + '.txt';
        }
    }


    let http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status !== 404;
}

function parseAnnotationFile(fileName, channel) {
    let rawFile = new XMLHttpRequest();
    let res = [];
    try {
        if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
            rawFile.open("GET", labelTool.workBlob + '/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/annotations/' + channel + '/' + fileName, false);
        } else {
            if (labelTool.loadNuScenesLabels === true) {
                rawFile.open("GET", labelTool.workBlob + '/' + labelTool.currentDataset + '/Annotations/' + channel + '/' + fileName, false);
            } else {
                rawFile.open("GET", labelTool.workBlob + '/' + labelTool.currentDataset + '/Annotations_test/' + fileName, false);
            }
        }


    } catch (error) {
        // no labels available for this camera image
        // do not through an error message
    }

    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status === 0) {
                let allText = rawFile.responseText;
                let str_list = allText.split("\n");
                for (let i = 0; i < str_list.length; i++) {
                    let str = str_list[i].split(" ");
                    if (labelTool.loadNuScenesLabels === true && str.length === 16) {
                        res.push({
                            class: str[0],
                            truncated: str[1],
                            occluded: str[2],
                            alpha: str[3],
                            left: str[4],
                            top: str[5],
                            right: str[6],
                            bottom: str[7],
                            height: str[8],
                            width: str[9],
                            length: str[10],
                            x: str[11],
                            y: str[12],
                            z: str[13],
                            rotation_y: str[14],
                            score: str[15]
                        });
                    } else if (labelTool.loadNuScenesLabels === false && str.length === 18) {
                        res.push({
                            class: str[0],
                            truncated: str[1],
                            occluded: str[2],
                            alpha: str[3],
                            left: str[4],
                            top: str[5],
                            right: str[6],
                            bottom: str[7],
                            height: str[8],
                            width: str[9],
                            length: str[10],
                            x: str[11],
                            y: str[12],
                            z: str[13],
                            rotation_y: str[14],
                            score: str[15],
                            trackId: str[16],
                            channel: str[17]
                        });
                    }
                }
                return res;
            } else {
                return null;
            }
        }
    };
    rawFile.send(null);
    return res;
}
