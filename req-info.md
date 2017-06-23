Base URL for all endpoints: **192.241.224.224:3000/api/**

//
*endpoint*: **192.241.224.224:3000/api/spots/single/**
*type*: POST
*keys*: spot_id (uid of the spot, i.e 007)
^ Should be sent as x-www-form-urlencoded
*sample output*:
    {
        "id_type": "@@@",
        "id_num": "101",
        "lat": 47.605416,
        "lon": -122.300733,
        "status": "T"
    }
**NOTE:** 1 call per spot.
//

//
*endpoint*: **192.241.224.224:3000/api/spots/onscreen/**
*type*: POST
*keys*: lower_lat, lower_lon, upper_lat, upper_lon
^ Should be sent as x-www-form-urlencoded
*comment*: Returns all the spots where:
lower_lon >= lon >= upper_lon
lower_lat >= lat >= upper_lat
*sample output (for one spot in range)*:
[
    {
        "id_type": "@@@",
        "id_num": "101",
        "lat": 47.605416,
        "lon": -122.300733,
        "status": "T"
    }
]
**NOTE:** This output might be pretty huge depending on how many spots there are in range.
//

//
*endpoint*: **192.241.224.224:3000/api/spots/status/**
*type*: POST
*keys*: spot_id, status
^ Should be sent as x-www-form-urlencoded
*comment*: status and spot_id are both of type varchar (String), and status
should be "T" or "F", "T" being "Taken" and "F" being "Free".
*sample output*:
    {
      "status" : "F"
    }
or
    {
      "status" : "T"
    }
**NOTE:** Returns the newly updated status if the operation succeeds.
//

//
*endpoint*: **192.241.224.224:3000/api/spots/closest/**
*type*: POST
*keys*: lat, lon
^ Should be sent as x-www-form-urlencoded
*comment*: these values correspond to the destination's location.
*sample output*:
  {
      "spot_id": "007",
      "lat": 47.604327,
      "lon": -122.2987888
  }
**NOTE:** Returns the spot_id of  the spot, as well as its location.
//
