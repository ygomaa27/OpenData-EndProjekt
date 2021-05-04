from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
import json, requests

#include our index
def index(request):
    #Https request the data 
    #Path https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:WCANLAGE2OGD&srsName=EPSG:4326&outputFormat=json
    data = requests.get('https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:WCANLAGE2OGD&srsName=EPSG:4326&outputFormat=json').json()
    return render(request, 'WcForYouApp/index.html', context = { 'data': data})
