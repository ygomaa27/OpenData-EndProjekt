

var center = {
  lat: 52.5159,
  lng: 13.3777,
};

var marker;

navigator.geolocation.getCurrentPosition(function (position) {
  center.lat = position.coords.latitude;
  center.lng = position.coords.longitude;
  console.log(center);
  let polygon;
  marker = new H.map.Marker(center, { volatility: true });
  marker.draggable = false;
  map.addObject(marker);

  console.log('updating...')

   //Configure the options object
   let currentDate = new Date();
   var options = {
      range: '900',
      rangeType: 'distance',
      center: marker.getGeometry(),
      date: toDateInputFormat(currentDate),
      time: to24HourFormat(currentDate.getHours())
   }

  map.setCenter(options.center, true);
});

const hereCredentials = {
  apikey: "oDCnOqKWetC09XxjxnDLuQj3DHvs2-cP8rOjFsXYCs8",
};

const $ = (q) => document.querySelector(q);
const $$ = (qq) => document.querySelectorAll(qq);

//Height calculations
const height =
$("#content-group-1").clientHeight || $("#content-group-1").offsetHeight;
$(".content").style.height = height + "px";


const platform = new H.service.Platform({ apikey: hereCredentials.apikey });
// Retrieve the target element for the map:
var targetElement = document.getElementById('map');
const defaultLayers = platform.createDefaultLayers();
const map = new H.Map(
  document.getElementById("map"),
  defaultLayers.vector.normal.map,
  {
    center,
    zoom: 17,
    pixelRatio: window.devicePixelRatio || 1,
  }
);
const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
const provider = map.getBaseLayer().getProvider();

//Initialize router and geocoder
var router = platform.getRoutingService(null, 8);
const geocoder = platform.getGeocodingService();

window.addEventListener("resize", () => map.getViewPort().resize());


// create default UI with layers provided by the platform
const ui = H.ui.UI.createDefault(map, defaultLayers);

//wc daten -> Yasin es geht los!

const group = new H.map.Group();
map.addObject(group);
group.addEventListener('tap', function (evt) {
  // event target is the marker itself, group is a parent event target
  // for all objects that it contains
  var bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
    // read custom data
    content: evt.target.getData()
  });
  // show info bubble
  ui.addBubble(bubble);
}, false);


const data = JSON.parse(document.getElementById('data').textContent);
data.features.forEach(function(obj){
   var pos = {
     lat: obj.geometry.coordinates[1],
     lng: obj.geometry.coordinates[0]
   }
   
   var svgMarkup = 
   '<svg width="30" height="30" ' +
   'xmlns="http://www.w3.org/2000/svg">' +
   '<rect stroke="white" fill="#1b468d" x="1" y="1" width="21" ' +
   'height="22" /><text x="12" y="18" font-size="10pt" ' +
   'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
   'fill="white">WC</text></svg>';

   var icon = new H.map.Icon(svgMarkup);
   var newmarker = new H.map.Marker(pos, { icon: icon });
   newmarker.setData("<p>Adresse: "+obj.properties.STRASSE+"\nKategorie :"+obj.properties.KATEGORIE+"\nÖffnungszeiten : "+obj.properties.OEFFNUNGSZEIT+"</p> <button id='route_button' onclick='routeToWc("+pos.lat+","+pos.lng+")'>Route  to WC</button>")
   group.addObject(newmarker);
});

function toAMPMFormat(val) {
  val = Number(val);
  if (val === 0) {
    return "12:00 AM";
  } else if (val < 12) {
    return `${val}:00 AM`;
  } else if (val === 12) {
    return `12:00 PM`;
  } else {
    return `${val - 12}:00 PM`;
  }
}

function to24HourFormat(val) {
  val = val + ":00";
  return val.length === 4 ? "0" + val : val;
}

function toDateInputFormat(val) {
  const local = new Date(val);
  local.setMinutes(val.getMinutes() - val.getTimezoneOffset());
  return local.toJSON().slice(0, 10);
}

function formatRangeLabel(range, type) {
  if (type === "time") {
    const minutes = range / 60;
    if (minutes < 60) {
      return minutes.toFixed(0) + " mins";
    } else {
      return (
        (minutes / 60).toFixed(0) +
        " hours, " +
        (minutes % 60).toFixed(0) +
        " mins"
      );
    }
  } else {
    //Distance
    if (range < 1000) {
      return range + " meters";
    } else {
      const km = range / 1000;
      return km.toFixed(1) + " KM";
    }
  }
}

var slider = document.getElementById("range");
var output = document.getElementById("rangevalue");
output.innerHTML = slider.value;
slider.oninput = function() {
  output.innerHTML = this.value;
}

function removeObjectById(id){
  for (object of map.getObjects()){
   if (object.id===id){
       map.removeObject(object);
       }
   }
}

function routerange(distance){
  var routingParams = {
    'mode': 'fastest;pedestrian;',
    'start': 'geo!'+center.lat+','+center.lng+'',
    'range': distance,
    'rangetype': 'distance'
  };
  
  // Define a callback function to process the isoline response.
  var onResult = function(result) {
    removeObjectById("polyroute");
    var isolineCoords = result.response.isoline[0].component[0].shape;
    var linestring = new H.geo.LineString();
  
    isolineCoords.forEach(function(coords) {
    linestring.pushLatLngAlt.apply(linestring, coords.split(','));
    });
    var isolinePolygon = new H.map.Polygon(linestring);
    isolinePolygon.id="polyroute";
    map.addObjects([marker, isolinePolygon]);
    map.getViewModel().setLookAtData({bounds: isolinePolygon.getBoundingBox()});
  };
  
  // Get an instance of the routing service:
  var router = platform.getRoutingService();
  
  // Call the Routing API to calculate an isoline:
  router.calculateIsoline(
    routingParams,
    onResult,
    function(error) {
    alert(error.message);
    }
  );
}

// Define a callback function to process the routing response:
var onResult = function(result) {
  // ensure that at least one route was found
  if (result.routes.length) {
    result.routes[0].sections.forEach((section) => {
         // Create a linestring to use as a point source for the route line
        let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

        // Create a polyline to display the route:
        let routeLine = new H.map.Polyline(linestring, {
          style: { strokeColor: 'blue', lineWidth: 3 }
        });

        // Add the route polyline and the two markers to the map:
        removeObjectById("route");
        routeLine.id="route";
        map.addObjects([routeLine]);

        // Set the map's viewport to make the whole route visible:
        map.getViewModel().setLookAtData({bounds: routeLine.getBoundingBox()});
    });
  }
};

function routeToWc(lat,lng){
  var routingParameters = {
    'routingMode': 'fast',
    'transportMode': 'pedestrian',
    // The start point of the route:
    'origin': center.lat+","+center.lng,//'48.1606776,16.3242066',
    // The end point of the route:
    'destination': lat+","+lng,
    // Include the route shape in the response
    'return': 'polyline'
  };
  router.calculateRoute(routingParameters, onResult,
    function(error) {
      alert(error.message);
    })
}
