# Response Codes

General success code: 100

## TWILIO SUCCESS/FAIL  
- Twilio request success: **100**  
- Twilio request fail (reqTwilioPin endpoint): **1**  

## FRESH AUTH FAIL  
- Authenticate Fail Pin Incorrect (authenticate endpoint): **2**  
- Authenticate Fail Pin Expired (authenticate endpoint): **3**  

## REAUTH FAIL  
- Reauthenticate Fail Access Token Expired (reauthenticate endpoint): **4**  
- Reauthenticate Fail Wrong Credentials (reauthenticate endpoint): **5**  

## AUTH/REAUTH SUCCESS  
- User auth/reauth success; new user (auth/reauth endpoint): **101**  
- User auth/reauth success; returning user (auth/reauth endpoint): **102**  
*NOTE: in auth success, return the response code AS WELL AS the access_token and the user_id*  

## UPDATE PROFILE SUCCESS/FAIL  
- Update profile success (updateProfile endpoint): **100**  
- Update profile fail (updateProfile endpoint): **6**  
- Add/Edit/Remove car success: **100**  
- Add/Edit/Remove car fail: **8**  

## GET PROFILE FAIL  
- Get profile fail (getProfile endpoint): **7**  
- Get profile success: Just return the data (*I can distinguish data from failure on my end*)  
- Get cars success: Just return the data
