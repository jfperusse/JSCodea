// © 2022 Jean-François Pérusse

var input = document.getElementById("codeaProjects");
var projects = {};
var packs = {};
var file = null;

function filenameWithoutExtension(path) {
    return path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf("."));
}

function loadZip(zip) {
    const promises = [];

    zip.forEach(function (_, zipEntry) {
        promises.push(new Promise(function (resolve, reject) {
            if (!zipEntry.name.includes("__MACOSX")) {
                var projectName = zipEntry.name.match(/\/([^\/]+)\.codea\//);
                if (projectName == null) {
                    projectName = zipEntry.name.match(/^([^\.]+)\.codea\//);
                }
                if (projectName) {
                    projectName = projectName[1];
                    if (!(projectName in projects)) {
                        projects[projectName] = {};
                        projects[projectName].images = {};
                        projects[projectName].code = {};
                        projects[projectName].dependencies = [];
                        projects[projectName].loadOrder = [];
                    }
                    if (zipEntry.name.endsWith(".png")) {
                        resolve(zipEntry.async("blob").then(function (blob) {
                            var filename = filenameWithoutExtension(zipEntry.name);
                            filename = filename
                                .replaceAll(" ", "_")
                                .replaceAll("'", "_");
                            projects[projectName].images[filename] = {}
                            projects[projectName].images[filename].url = URL.createObjectURL(blob);
                            projects[projectName].images[filename].width = 0;
                            projects[projectName].images[filename].height = 0;
                        }));
                        return;
                    }
                    else if (zipEntry.name.endsWith(".lua")) {
                        resolve(zipEntry.async("text").then(function (code) {
                            var filename = filenameWithoutExtension(zipEntry.name);
                            projects[projectName].code[filename] = code;
                        }));
                    }
                    else if (zipEntry.name.endsWith("Info.plist")) {
                        resolve(zipEntry.async("text").then(function (text) {
                            var parser = new DOMParser();
                            var xmlDoc = parser.parseFromString(text, "text/xml");
                            var keys = xmlDoc.getElementsByTagName("key");
                            for (const key of keys) {
                                if (key.textContent == "Dependencies" && key.nextElementSibling.tagName == "array") {
                                    for (const child of key.nextElementSibling.children) {
                                        var dependency = child.textContent;
                                        if (dependency.includes(":")) {
                                            dependency = dependency.substring(dependency.lastIndexOf(":") + 1);
                                        }
                                        projects[projectName].dependencies.push(dependency);
                                    }
                                }

                                if (key.textContent == "Buffer Order" && key.nextElementSibling.tagName == "array") {
                                    for (const child of key.nextElementSibling.children) {
                                        projects[projectName].loadOrder.push(child.textContent);
                                    }
                                }
                            }
                        }));
                    }
                }
                else {
                    var packName = zipEntry.name.match(/^([^\.]+)\.assets\//);

                    if (packName) {
                        packName = packName[1]
                            .replaceAll(" ", "_")
                            .replaceAll("'", "_");

                        if (!(packName in packs)) {
                            packs[packName] = {};
                            packs[packName].musics = {};
                            packs[packName].sounds = {};
                        }

                        if (zipEntry.name.endsWith(".m4a")) {
                            resolve(zipEntry.async("blob").then(function (blob) {
                                var filename = filenameWithoutExtension(zipEntry.name);
                                filename = filename
                                    .replaceAll(" ", "_")
                                    .replaceAll("'", "_");
                                packs[packName].musics[filename] = URL.createObjectURL(blob);
                            }));
                            return;
                        }
                        else if (zipEntry.name.endsWith(".caf") || zipEntry.name.endsWith(".wav")) {
                            resolve(zipEntry.async("blob").then(function (blob) {
                                var filename = filenameWithoutExtension(zipEntry.name);
                                filename = filename
                                    .replaceAll(" ", "_")
                                    .replaceAll("'", "_");
                                packs[packName].sounds[filename] = URL.createObjectURL(blob);
                            }));
                            return;
                        }
                    }
                }
            }

            resolve();
        }));
    });

    return Promise.all(promises);
}

function processProjectsList(file) {
    file = input.files[0];

    if (file) {
        console.log(`loading ${file.name}...`);
        return JSZip.loadAsync(file).then(loadZip, function (e) {
            console.error("error reading file");
        });
    }

    return new Promise(function(resolve, _) {
        resolve();
    });
}

var imageToLoad = 0;
var imageKeys = null;

function loadNextImage() {
    if (imageToLoad < imageKeys.length) {
        var filename = imageKeys[imageToLoad];
        var image = loadedProject.images[filename];
        image.img = new Image();
        image.img.onload = function() {
            console.log(`loaded ${filename} (${this.width}, ${this.height})`);
            imageToLoad = imageToLoad + 1;
            loadNextImage();
        };
        image.img.src = loadedProject.images[filename].url;
    }
    else {
        console.log(`${imageToLoad} images loaded.`);
        onImagesLoaded();
    }
}

function onImagesLoaded() {
    var luaCode = "";

    for (const dependency of loadedProject.dependencies) {
        for (const key of projects[dependency].loadOrder) {
            if (key !== "Main") {
                luaCode += projects[dependency].code[key] + "\n";
            }
        }
    }

    for (const key of loadedProject.loadOrder) {
        luaCode += loadedProject.code[key] + "\n";
    }

    console.log(`Loaded ${luaCode.length} bytes.`);

    //console.log(luaCode);

    startRuntime(luaCode);    
}

function loadProject(projectName) {
    loadedProject = projects[projectName]

    console.log(`loading ${projectName}...`);

    console.log("Loading images...");

    imageKeys = Object.keys(loadedProject.images);

    loadNextImage();
}

function onProjectsLoaded() {
    loadProject('LostControls');

    //document.getElementById("manual").style.display = "inline-block";

    if (input) {
        input.value = null;
    }
}

function onFileSelected() {
    processProjectsList(input.files[0]).then(onProjectsLoaded);
}            

if (input) {
    input.addEventListener('change', onFileSelected);
}

var request = indexedDB.open("JSCodeaDatabase", 1);
var db;

request.onerror = function(event) {
  alert("Pour un chargement plus rapide les prochaines fois, veuillez accepter l'utilisation de la base de données.");
};

request.onupgradeneeded = function () {
    console.log("onupgradeneeded");
    const db = request.result;
    const store = db.createObjectStore("assets");
};

request.onsuccess = function(event) {
  db = event.target.result;
  db.onerror = function(event) {
    alert("Database error: " + event.target.errorCode);
  };
  loadProjects()
};

function fetchRemoteFile(filename, useCache) {
    return fetch(`${filename}`, {cache: "no-store"})
        .then(function (response) {
            if (response.status === 200 || response.status === 0) {
                return response.blob();
            } else {
                throw new Error(response.statusText);
            }
        })
        .then(function(blob) {
            if (useCache) {
                const putTransaction = db.transaction("assets", "readwrite");
                const store = putTransaction.objectStore("assets");
                store.put(blob, filename);
            }
            return blob;
        })
        .then(JSZip.loadAsync)
        .then(loadZip);
}

function fetchFile(filename, useCache) {    
    return new Promise(
        function(resolve, reject) {
            if (useCache) {
                const getTransaction = db.transaction("assets", "readonly");
                const store = getTransaction.objectStore("assets");
                const urlQuery = store.get(filename);

                urlQuery.onsuccess = function() {
                    if (urlQuery.result) {
                        resolve(JSZip.loadAsync(urlQuery.result).then(loadZip));
                    }
                    else {
                        resolve(fetchRemoteFile(filename, useCache));
                    }
                }    
            }
            else {
                resolve(fetchRemoteFile(filename, useCache));
            }
        }
    );
}
  
function loadProjects() {
    width = myCanvas.width;
    height = myCanvas.height;

    updateCanvasSize();

    myContext.fillStyle = "#282831";
    myContext.fillRect(0, 0, width, height);

    myContext.fillStyle = "#ffffff";
    myContext.textAlign = "center";
    myContext.textBaseline = "middle";        
    myContext.font = `64px Arial`;
    myContext.fillText("Loading...", width / 2, height / 2);
    
    var promises = []

    promises.push(fetchFile("Common.zip", false))
    promises.push(fetchFile("LostControls.zip", false))
    promises.push(fetchFile("https://storage.googleapis.com/jscodea.appspot.com/A%20Hero's%20Quest.assets.zip", true))
    promises.push(fetchFile("https://storage.googleapis.com/jscodea.appspot.com/Game%20Sounds%20One.assets.zip", true))

    Promise.all(promises).then(onProjectsLoaded);
}
