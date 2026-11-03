importScripts("./png2hicolorgb.js");

const handleLog = (message) => {
  postMessage({ action: "log", message: message });
};

const handleConvert = async (file, argsArray) => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const module = await Module({
    print: handleLog,
    printErr: handleLog,
  });
  module.FS.mkdir("/out");
  module.FS.chdir("/out");

  module.FS.writeFile("/out/input.png", bytes);

  const status = module.callMain([
    "/out/input.png",
    "-o",
    file.name,
    ...argsArray,
  ]);

  const outputs = module.FS.readdir("/out").filter(
    (name) => ![".", "..", "input.png"].includes(name),
  );

  let outputFiles = [];
  for (const name of outputs) {
    const data = module.FS.readFile(`/out/${name}`);
    const blob = new Blob([data], {
      type: "application/octet-stream",
    });

    outputFiles.push({
      name: name,
      blob: blob,
    });
  }

  postMessage({ action: "success", files: outputFiles });
};

const handleHelp = async () => {
  const module = await Module({
    print: handleLog,
    printErr: handleLog,
  });
  const status = module.callMain(["-h"]);
};

self.onmessage = (event) => {
  const data = event.data;
  switch (data.action) {
    case "convert": {
      handleConvert(data.file, data.argsArray);
      break;
    }
    case "help": {
      handleHelp();
      break;
    }
  }
};
