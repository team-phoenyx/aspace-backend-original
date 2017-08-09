**aspace API Documentation and References**
------

#### Base URL for all endpoints: **138.68.241.101:3000/api/**
#### **ALL KEYS/VALUES should be sent as x-www-form-urlencoded**
---
## Spots  
**POST: 138.68.241.101:3000/api/spots/single/**  

Gets data on a single spot given the spot_id  

**Request Body**:  

+ spot_id (uid of the spot, i.e 007)  

**Response Format**:  
```
{  
  "sector_id" : "aCqgkSbhpWyublqGtvhaTrg",
  "spot_id": "101",  
  "lat": 47.605416,  
  "lon": -122.300733,  
  "status": "T"  
}
```
**NOTE:** 1 call per spot.
------

**POST: 138.68.241.101:3000/api/spots/onscreen/**  

Returns all spots where lower_lon >= lon >= upper_lon **and** lower_lat >= lat >= upper_lat  

**Request Body**:  
* lower_lat  
* lower_lon  
* upper_lat  
* upper_lon  

**Response Format**:  
```
[  
  {  
    "sector_id" : "aCqgkSbhpWyublqGtvhaTrg",
    "spot_id": "101",  
    "lat": 47.605416,  
    "lon": -122.300733,  
    "status": "T"  
  }  
]
```
**NOTE:** This output might be pretty huge depending on how many spots there are in range.
------

**POST: 138.68.241.101:3000/api/spots/status/**  

Updates the status of a single spot  

*keys*: spot_id, status
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
---
**DEPRECATED**
<!-- *endpoint*: **138.68.241.101:3000/api/spots/closest/**
*type*: POST
*keys*: lat, lon
*comment*: these values correspond to the destination's location.
*sample output*:
  {
      "sector_id" : "aCqgkSbhpWyublqGtvhaTrg",
      "spot_id": "7",
      "lat": 47.604327,
      "lon": -122.2987888,
      "distance": 3.2
  }
**NOTE:** Returns physical location of the spot, and distance from destination in meters. -->
**DEPRECATED**
---

*endpoint*: **138.68.241.101:3000/api/users/profile/update/**
*type*: POST
*keys*: name, user_id, phone, access_token
*sample output*:
  {
    "resp_code" : 100
  }
  or
  {
    "resp_code" : 6
  }
---

*endpoint*: **138.68.241.101:3000/api/users/profile/get/**
*type*: POST
*keys*: phone, access_token, user_id
*sample output*:
  {
    "access_token" : "dgshrewhehegshgewet4ttsdghj",
    "user_id" : "32t432rw236325135",
    "home_address" : "31sdgkhelskdfds",
    "home_loc_id" : "32r4532t52",
    "work_address" : "31613531",
    "work_loc_id" : "316531631",
  }
---

*endpoint*: **138.68.241.101:3000/api/users/auth/pin/**
*type*: POST
*keys*: phone
*comment*: uses phone to send SMS.
*sample output*:
  {
    "resp_code" : "100"
  }
  or
  {
    "resp_code" : "1"
  }
---

*endpoint*: **138.68.241.101:3000/api/users/auth/verify/**
*type*: POST
*keys*: phone, pin
*comment*: recieve access token if pin/phone match.
*sample output*:
  {
    "access_token" : "dgshrewhehegshgewet4ttsdghj",
    "user_id" : "5",
    "resp_code" : "100"
  }
  or
  {
    "resp_code" : "1"
  }
  or
  {
    "resp_code" : "2"
  }
  or
  {
    "resp_code" : "3"
  }

---

*endpoint*: **138.68.241.101:3000/api/users/auth/reauth/**
*type*: POST
*keys*: access_token, phone, user_id
*comment*: returns user data if access_token/phone/user_id match.
*sample output*:
{
  "resp_code" : "100"
}
or
{
  "resp_code" : "4"
}
{
  "resp_code" : "5"
}
---
##Cars

*endpoint*: **138.68.241.101:3000/api/users/profile/cars/add/**
*type*: POST
*keys*: phone, access_token, user_id, car_name, car_vin, car_make, car_model, car_length (in meters)
*sample output*:
  {
    "resp_code" : "100"
  }
  or
  {
    "resp_code" : "1"
  }
---

*endpoint*: **138.68.241.101:3000/api/users/profile/cars/remove/**
*type*: POST
*keys*:  phone, access_token, user_id, obj_id
*sample output*:
  {
    "resp_code" : "1"
  }
  or
  {
    "resp_code" : "100"
  }
---

*endpoint*: **138.68.241.101:3000/api/users/profile/cars/update/**
*type*: POST
*keys*: same keys as */users/profile/cars/add/*
*sample output*:
  {
    "resp_code" : "1"
  }
  or
  {
    "resp_code" : "100"
  }

---

*endpoint*: **138.68.241.101:3000/api/users/profile/cars/get/**
*type*: POST
*keys*: phone, access_token, user_id
*sample output*:
  {
    "resp_code" : "1"
  }
  or
  a json array of every car the user has
---

*endpoint*: **138.68.241.101:3000/api/users/profile/locs/add/**
*type*: POST
*keys*:  phone, access_token, user_id, address, location_id, location_name
*sample output*:
  {
    "resp_code" : "1"
  }
  or
  {
    "resp_code" : "100"
  }
---

*endpoint*: **138.68.241.101:3000/api/users/profile/locs/remove/**
*type*: POST
*keys*:  phone, access_token, user_id, obj_id
*sample output*:
  {
    "resp_code" : "1"
  }
  or
  {
    "resp_code" : "100"
  }
---

*endpoint*: **138.68.241.101:3000/api/users/profile/locs/update/**
*type*: POST
*keys*: same keys as */users/profile/locs/add/*
*sample output*:
  {
    "resp_code" : "1"
  }
  or
  a json object of the location that was updated, pretty much same as */users/profile/locs/add/*
---

*endpoint*: **138.68.241.101:3000/api/users/profile/locs/get/**
*type*: POST
*keys*: phone, access_token, user_id
*sample output*:
  {
    "resp_code" : "1"
  }
  or
  a json array of every location a user has
---
