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
      range: $('#range').value,
      rangeType: $('#distance').checked ? 'distance' : 'time',
      center: marker.getGeometry(),
      date: toDateInputFormat(currentDate),
      time: to24HourFormat(currentDate.getHours())
   }
  
  map.setCenter(options.center, true);

   //new field

   requestIsolineShape = options => {
    var params = {
       'mode': `fastest;${options.mode};traffic:enabled`,
       'start': `geo!${options.center.lat},${options.center.lng}`,
       'range': options.range,
       'rangetype': 'pedestrian',
       'departure': `${options.date}T${options.time}:00`,
    };

    return new Promise((resolve, reject) => {
      router.calculateIsoline(
         params,
         res => {
            const shape = res.response.isoline[0].component[0].shape.map(z => z.split(','));
            resolve( shape )
         },
         err => reject(err)
      );
    })
    }
  
    calculateIsoline();
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
const router = platform.getRoutingService();
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
   newmarker.setData("<p>Adresse: "+obj.properties.STRASSE+"\nKategorie :"+obj.properties.KATEGORIE+"\nÖffnungszeiten : "+obj.properties.OEFFNUNGSZEIT+"</p>")
   group.addObject(newmarker);
});

//bis hier funktioniert alles!!!

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



const isolineMaxRange = {
  time: 600, //seconds -> 10 min
  distance: 1000 //meters
}

var requestIsolineShape;

async function calculateIsoline() {
  //Configure the options object
  let currentDate = new Date();
  const options = {
    mode: 'pedestrian',
    range:  $('#range').value,
    rangeType: $('#distance').checked ? 'distance' : 'time',
    center: marker.getGeometry(),
    date: toDateInputFormat(currentDate),
    time: to24HourFormat(currentDate.getHours())
  }

  //Limit max ranges
  if (options.rangeType === 'distance') {
     if (options.range > isolineMaxRange.distance) {
        options.range = isolineMaxRange.distance
     }
     $('#range').max = isolineMaxRange.distance;
  } else if (options.rangeType == 'time') {
     if (options.range > isolineMaxRange.time) {
        options.range = isolineMaxRange.time
     }
     $('#range').max = isolineMaxRange.time;
  }

  //Format label
  $('#slider-val').innerText = formatRangeLabel(options.range, options.rangeType);
  
  //Center map to isoline
  map.setCenter(options.center, true);

  const linestring = new H.geo.LineString();

   const isolineShape = await requestIsolineShape(options);
   isolineShape.forEach(p => linestring.pushLatLngAlt.apply(linestring, p));

   if (polygon !== undefined) {
      map.removeObject(polygon);
   }

   polygon = new H.map.Polygon(linestring, {
      style: {
         fillColor: 'rgba(74, 134, 255, 0.3)',
         strokeColor: '#4A86FF',
         lineWidth: 2
      }
   });
   map.addObject(polygon);
}
