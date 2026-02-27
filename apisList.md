authRouter
POST /signup - user account creation
POST /login
POST /logout

profileRouter
GET /profile/view - get profile of user
PATCH /profile/edit - edit profile details other than email, user id and password(separate for password)
PATCH /profile/password - edit profile password

requestRouter
POST /request/send/interested/:userId
POST /request/view/rejected/:userId
//These 2 can be clubbed together into one api

POST /request/review/accepted/:requestId
POST /request/review/rejected/:requestId

GET /connections
GET /requests/received
GET /feed - main api, which gives profile of other users

status - igno0red,rejected,accepted,interested
