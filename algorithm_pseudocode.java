


run() {
  List<ParkingSpot> spots;
  LatLng destination; //received in request

  //STEP 1: Search radius calculation (basically radius starts at 100m, increases until number of parking spots in radius exceeds 30)
  int radius = 100; //in meters
  spots = querySpots(destination, radius);
  while (spots.size() < 30) {
    radius += 50;
    spots = querySpots(destination, radius);
  }
  //STEP 1 COMPLETE: spots now contains all the parking spots within the search radius

  //STEP 2: Sort the parking spots by sectors
  List<Sector> sectors = new ArrayList<>(); //a sector is really just a list of parking spots with endpoint latlngs
  for (ParkingSpot spot : spots) { //foreach statement running throw all ParkingSpots in spots
    //Check if the sectors list already has a sector containing the spot;
    //if so, add the spot to the sector; if not, make a sector and add the spot to it
    int sectorIndex = getIndexOfSectorContainingSpot(sectors, spot);
    if (sectorIndex == -1) { //no existing sector contains the spot; make a new sector
      sectors.add(new Sector(spot));
    } else { //sector exists, and the index of the sector is in sectorIndex; add the spot to that sector in the list
      sectors.get(sectorIndex).addSpot(spot); //only works if .get() returns a reference to the List, not a copy (e.g. Java)
    }
  }

  //STEP 3: 

}

int getIndexOfSectorContainingSpot(List<Sector> sectors, ParkingSpot spot) {
  for (Sector sector : sectors) {
    if (spot.sectorID == sector.id) { //the spot belongs to this sector
      return sectors.indexOf(sector);
    }
  }
  return -1; //spot doesn't belong to any of these existing sectors
}

//Gets the parking spots within the search radius of the destination
List<ParkingSpot> querySpots(LatLng destination, int radius) {
  //Get the spots from the database that are within a SQUARE bounding box
  BoundingBox rawBBox = getSquareBoundingBox(destination, radius);

  List<ParkingSpot> rawCompatibleSpots = queryDB(SELECT FROM spots WHERE
    latitude > rawBBox.sw.latitude AND
    latitude < rawBBox.ne.latutude AND
    longitude > rawBBox.sw.longitude AND
    longitude < rawBBox.ne.longitude); //THIS LINE IS VERY PSEUDO, implement the query however you like

  List<ParkingSpot> compatibleSpots = new ArrayList<>();
  //foreach statement running through every ParkingSpot in rawCompatibleSpots
  //rawCompatibleSpots contains the spots in the square bounding box, but must be checked to see if they are in the circle search area
  for (ParkingSpot checkSpot : rawCompatibleSpots) {
    if (haversine(destination, checkSpot.latLng) < radius) compatibleSpots.add(checkSpot); //if the distance between the spot and the destination is under the radius, add to the final list of good spots
  }

  return compatibleSpots;
}

//Gets the NE and SW of the bounding box around the search area (used to efficiently query the DB for possibly compatible parking spots)
BoundingBox getSquareBoundingBox(LatLng origin, double distanceInYards) {
  LatLng ne = inverseHaversine(origin, Math.sqrt(2 * distanceInYards * distanceInYards), 315); //bearing is counterclockwise from true north
  LatLng sw = inverseHaversine(origin, Math.sqrt(2 * distanceInYards * distanceInYards), 135);
  return new BoundingBox(ne, sw);
}

LatLng inverseHaversine(LatLng origin, double distance, int bearing) {
  //Convert input LatLng and bearing to radians
  double radialLat1 = origin.latitude / 180 * Math.PI;
  double radialLon1 = origin.longitude / 180 * Math.PI;
  double radialBearing = bearing / 180 * Math.PI;
  double radialDistance = distance / 6371010; //convert distance into angle w/ respect to the earth's radius (6371010 is Earth's radius in meters)

  double radialLat2 = Math.asin(Math.sin(radialLat1) * Math.cos(radialDistance) + Math.cos(radialLat1) * Math.sin(radialDistance) * Math.cos(radialBearing));

  double radialLon2;
  if (Math.abs(Math.cos(radialLat2)) < 0.000001) { //0.000001 is the threshold for floating point equality (checks if cos(radialLat2) is effectively 0, or if the endpoint is a pole)
    radialLon2 = radialLon1;
  } else {
    radialLon2 = ((radialLon1 - Math.asin(Math.sin(radialBearing) * Math.sin(radialDistance) / Math.cos(radialLat2)) + Math.PI) % (2 * Math.PI)) - Math.PI;
  }

  double lat2 = radialLat2 / Math.PI * 180;
  double lon2 = radialLon2 / Math.PI * 180;

  return new LatLng(lat2, lon2);
}

double haversine(LatLng pointA, LatLng pointB) {
  //Convert shit to radians
  double dLat = (pointB.latitude - pointA.latitude) / 180 * Math.PI;
  double dLon = (pointB.longitude - pointA.longitude) / 180 * Math.PI;
  double latA = (pointA.latitude) / 180 * Math.PI;
  double latB = (pointB.latitude) / 180 * Math.PI;

  //Magic
  double a = Math.pow(Math.sin(dLat / 2), 2) + Math.pow(Math.sin(dLon / 2), 2) * Math.cos(latA) * Math.cos(latB);
  double c = 2 * Math.asin(Math.sqrt(a));
  return 6371010 * c; //Return distance in meters (6371010 is radius of Earth in meters)
}

class BoundingBox {
  LatLng ne;
  LatLng sw;

  BoundingBox (LatLng ne, LatLng sw) {
    this.ne = ne;
    this.sw = sw;
  }
}

//STEP 2:
