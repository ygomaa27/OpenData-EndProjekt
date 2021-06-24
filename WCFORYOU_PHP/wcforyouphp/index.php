<!DOCTYPE html>
<html>

<head>
  <title>WcForYou</title>

  
  <!-- JS API -->
  <link rel="stylesheet" type="text/css" href="https://js.api.here.com/v3/3.1/mapsjs-ui.css" />
  <script src="https://js.api.here.com/v3/3.1/mapsjs-core.js"></script>
  <script src="https://js.api.here.com/v3/3.1/mapsjs-service.js"></script>
  <script src="https://js.api.here.com/v3/3.1/mapsjs-ui.js"></script>
  <script src="https://js.api.here.com/v3/3.1/mapsjs-mapevents.js"></script>

  <!-- Turf for area calculations -->
  <script src="https://npmcdn.com/@turf/turf/turf.min.js"></script>

  <!-- Date -->
  <script src="https://unpkg.com/better-dom@4.0.0/dist/better-dom.min.js"></script>
  <script src="https://unpkg.com/better-dateinput-polyfill@3.2.7/dist/better-dateinput-polyfill.min.js"></script>

  <!-- Style -->
  <link rel="stylesheet" type="text/css" href="static/css/index.css" />
  <link rel="stylesheet" type="text/css" href="static/css/sidebar.css"/>
  <link rel="stylesheet" type="text/css" href="static/css/search.css" />

</head>

<body>
  <div id="map"></div>
  <div id="sidebar">
    <div class="gradient-line"></div>
    <div class="header">
      <h1>Welcome to WcForYou</h1>
      <p>All the restrooms in you area!</p>
    </div>
    <div class="content">
      <div class="content-group" id="content-group-1">
        <div class="group">
          <h2>Range Options</h2>
          <input class="isoline-controls slider" id="range" type="range" min="0" max="2000" value="50" onclick='routerange(value)' />
          <p>meters: <span id="rangevalue"></span></p>
          <h2>Map View</h2>
          <label class="radio-container">
            <input class="view-controls" type="radio" id="static" name="map-view" onclick="calculateView()" checked>
            <span class="checkmark"></span>
            Static top-down
          </label>
          <label class="radio-container">
            <input class="view-controls" type="radio" id="rotating" onclick="calculateView()" name="map-view">
            <span class="checkmark"></span>
            Rotating angle
          </label>
        </div>
      </div>
    </div>
  </div>
  <?php
  $url = "https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:WCANLAGE2OGD&srsName=EPSG:4326&outputFormat=json";
  $content = file_get_contents($url);
  $data = json_decode($content, true);
  ?>
  <script>
    <?php echo 'const data = ' . json_encode($data) . ';'; ?>
  </script>
  <script src="static/js/app.js"></script>
</body>
</html>