class Plugin {
  constructor() {
    this.artifactCheckbox = document.createElement('button');
    this.artifactCheckbox.style.marginLeft = 'auto';
  }

  async processMap(input) {
    let chunks;
    try {
      chunks = JSON.parse(input);
    } catch (err) {
      console.error(err);
      this.status.innerText = 'Invalid map data. Check the data in your file.';
      this.status.style.color = 'red';
      return;
    }

    this.status.innerText = 'Importing, this will take awhile...';
    this.status.style.color = 'white';
    try {
      await df.bulkAddNewChunks(chunks)
      this.status.innerText = 'Successfully imported map!';
    } catch (err) {
      console.log(err);
      this.status.innerText = 'Encountered an unexpected error.';
      this.status.style.color = 'red';
    }
  }

  onImport = async () => {
    let input;
    try {
      input = await window.navigator.clipboard.readText();
    } catch (err) {
      console.error(err);
      this.status.innerText = 'Unable to import map. Did you allow clipboard access?';
      this.status.style.color = 'red';
      return;
    }
    this.processMap(input);
  }

  onUpload = async () => {
    let inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.onchange = () => {
      try {
        var file = inputFile.files.item(0);
        var reader = new FileReader();
        reader.onload = () => {
          this.processMap(reader.result);
        };
        reader.readAsText(file);
      } catch (err) {
        console.error(err);
        this.status.innerText = 'Unable to upload map.';
        this.status.style.color = 'red';
        return;
      }
    }
    inputFile.click();
  }

  intersectsXY(chunk, begin, end) {
    const chunkLeft = chunk.chunkFootprint.bottomLeft.x;
    const chunkRight = chunkLeft + chunk.chunkFootprint.sideLength;
    const chunkBottom = chunk.chunkFootprint.bottomLeft.y;
    const chunkTop = chunkBottom + chunk.chunkFootprint.sideLength;

    return (
      chunkLeft >= begin.x &&
      chunkRight <= end.x &&
      chunkTop <= begin.y &&
      chunkBottom >= end.y
    );
  }

  generateMap() {
    let chunks = ui.getExploredChunks();
    let chunksAsArray = Array.from(chunks);
    if (this.beginCoords && this.endCoords) {
      let begin = {
        x: Math.min(this.beginCoords.x, this.endCoords.x),
        y: Math.max(this.beginCoords.y, this.endCoords.y),
      };
      let end = {
        x: Math.max(this.beginCoords.x, this.endCoords.x),
        y: Math.min(this.beginCoords.y, this.endCoords.y),
      };
      chunksAsArray = chunksAsArray.filter(chunk => {
        return this.intersectsXY(chunk, begin, end);
      });
    }
    return chunksAsArray;
  }

  onExport = async () => {
    let mapRaw = this.generateMap();
    try {
      let map = JSON.stringify(mapRaw);
      await window.navigator.clipboard.writeText(map);
      this.status.innerText = 'Map copied to clipboard!';
      this.status.style.color = 'white'
    } catch (err) {
      console.error(err);
      this.status.innerText = 'Failed to export map.';
      this.status.style.color = 'red';
    }
  }

  onDownload = async () => {
    let mapRaw = this.generateMap();
    try {
      let map = JSON.stringify(mapRaw);
      var blob = new Blob([map], { type: 'application/json' }),
        anchor = document.createElement('a');
      anchor.download = df.getContractAddress().substring(0, 6) + '_map.json';
      anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
      anchor.dataset.downloadurl = ['application/json', anchor.download, anchor.href].join(':');
      anchor.click();
      this.status.innerText = 'Saving map!';
      this.status.style.color = 'white';
    } catch (err) {
      console.error(err);
      this.status.innerText = 'Failed to download map.';
      this.status.style.color = 'red';
    }
  };

  onMouseMove = () => {
    let coords = ui.getHoveringOverCoords();
    if (coords) {
      if (this.beginCoords == null) {
        this.beginXY.innerText = `Begin: (${coords.x}, ${coords.y})`
        return;
      }

      if (this.endCoords == null) {
        this.endXY.innerText = `End: (${coords.x}, ${coords.y})`
        return;
      }
    }
  }

  onClick = () => {
    let coords = ui.getHoveringOverCoords();
    if (coords) {
      if (this.beginCoords == null) {
        this.beginCoords = coords;
        return;
      }

      if (this.endCoords == null) {
        this.endCoords = coords;
        return;
      }
    }
  }

  giftPlanet = (planet) => {
      let value = 'Krafstof'
      let player = ui.getAllPlayers().find(player => {
        return player.address === value || player.twitter === value;
      });
      df.transferOwnership(planet.locationId, player.address);
      return;
  }

  giftEmpire = () => {
    for (let planet of df.getMyPlanets()) {
      this.giftPlanet(planet);
    }
  }

  async render(container) {
    let giftButton = document.createElement('button');
    giftButton.style.width = '100%';
    giftButton.innerText = 'Run algo';
    giftButton.onclick = this.giftEmpire;
    container.appendChild(giftButton);
  }
}

var amogus = Plugin
export {
  amogus as default
}

//export default Plugin;