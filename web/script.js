let currentFile;
let outputFiles = [];

const worker = new Worker("./web/png2hicolorgb-worker.js");
worker.onmessage = (event) => {
  const data = event.data;
  switch (data.action) {
    case "log": {
      handleLog(data.message);
      break;
    }
    case "success": {
      outputFiles = data.files;
      refreshOutputFiles();
      break;
    }
  }
};

const handleLog = (message) => {
  const log = document.querySelector("#log");
  log.textContent += `${message}\n`;
};

const clearLog = () => {
  log.textContent = ``;
};

const refreshOutputFiles = () => {
  const zip = new JSZip();

  const outputFilesElement = document.querySelector("#output");
  outputFilesElement.innerHTML = "";

  if (outputFiles.length <= 0) {
    return;
  }

  outputFiles.forEach((file) => {
    const url = window.URL.createObjectURL(file.blob);

    outputFilesElement.innerHTML += `<span class="row"><a href="${url}" download="${file.name}">${file.name}</a></span>`;

    zip.file(file.name, file.blob);
  });

  outputFilesElement.innerHTML += `<span class="gap"></span>`;

  zip.generateAsync({ type: "blob" }).then((blob) => {
    const url = window.URL.createObjectURL(blob);

    outputFilesElement.innerHTML += `<span class="row zip"><a href="${url}" download="${currentFile.name}.zip">Download zip</a></span>`;
  });
};

const handleHelp = () => {
  clearLog();

  worker.postMessage({
    action: "help",
  });
};

const handleConvert = () => {
  clearLog();
  const file = currentFile;

  if (!file) {
    handleLog("Drop a png file before converting");
    return;
  }

  const options = document.querySelector("#options");
  const argsArray = options.value ? options.value.split(" ") : [];

  worker.postMessage({
    action: "convert",
    file: file,
    argsArray: argsArray,
  });
};

const handleFileLoad = async (file) => {
  if (currentFile != undefined) {
    reset();
  }

  currentFile = file;

  const img = new Image();

  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  const reader = new FileReader();

  reader.onload = () => {
    // file load
    img.onload = () => {
      // image load
      canvas.width = Math.max(160, img.width);
      canvas.height = Math.max(256, img.height);
      canvas.style.width = `${Math.max(160, img.width) * 2}px`;
      canvas.style.height = `${Math.max(256, img.height) * 2}px`;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.parentElement.classList.add("has-content");
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);

  handleConvert();
};

const handleDragOver = (e) => {
  e.stopPropagation();
  e.preventDefault();

  e.currentTarget.classList.add("hover");
};

const handleDragLeave = (e) => {
  e.currentTarget.classList.remove("hover");
};

const handleDrop = async (e) => {
  e.stopPropagation();
  e.preventDefault();

  e.currentTarget.classList.remove("hover");

  const file = e.dataTransfer.files[0];

  if (!file) {
    handleLog("No file received. Try dropping a PNG from your file manager.");
    return;
  }

  if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
    handleLog("Please drop a PNG file.");
    return;
  }

  try {
    await handleFileLoad(file);
  } catch (error) {
    handleLog(`Could not load file: ${error.message}`);
  }
};

const handleOnClick = async (e) => {
  document.querySelector("#filepicker").click();
};

const handleFiles = (e) => {
  const fileList = e.target.files;
  const file = fileList[0];
  handleFileLoad(file);
};

const load = () => {
  const input = document.querySelector("#input");
  input.addEventListener("dragover", handleDragOver, false);
  input.addEventListener("dragleave", handleDragLeave, false);
  input.addEventListener("drop", handleDrop, false);
  input.addEventListener("click", handleOnClick, false);

  const filePicker = document.querySelector("#filepicker");
  filePicker.addEventListener("change", handleFiles, false);
};

const reset = () => {
  currentFile = undefined;
  outputFiles = [];
  refreshOutputFiles();
  clearLog();
};
