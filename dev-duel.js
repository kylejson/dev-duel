(function(){
/*********************
 Global variables and Functions
********************/
  //rooms with hold game session and two player objects
  Rooms = new Meteor.Collection("rooms");
  Moves = new Meteor.Collection("moves");

  Move = {
    init: function(title, damage, used) {
      this.title = title;
      this.damage = damage;
      this.used = used;
    }
  };

  //Globals
  var roomId;
  
  //Gravatar Globals
  TwitterPoint = 0;
  GithubPoint = 0;
  picUrl = '';
  twitterHandle = '';
  hash = '';

/*********************
Gravatar Function
********************/
  function getGravatar(email){
    hash = $.md5(email);
    return hash;
  }
  function makeUrl(hash){
    var baseUrl = 'http://gravatar.com/avatar/';
    var picUrl = baseUrl + hash + '.jpg?s=100';
    return picUrl; 
  }
/*********************
Meteor on the Client
********************/
  if (Meteor.isClient) {
    console.log(Meteor.status());
    if(!Meteor.status().connected) {
      Meteor.disconnect();
      Meteor.reconnect();
    }
    //home page client functions/events
    Template.home.events({
      'click .play' : function () {
        Router.go('/form');
      }
    });
    
    // form page created
    Template.formPage.created = function() {
      if(Meteor.user() && Meteor.user().profile.Player) {
        Router.go('/craft');
      }
    };

    //form page client functions/events
    Template.formPage.events({
      //submit
      'keyup #gravatar-email' : function () {
          var email = $('#gravatar-email').val();
          getGravatar(email);
          var gravatarUrl = makeUrl(hash);
          $('.pic').empty();
          $('.pic').append('<img src="'+ gravatarUrl+ '"/>');
      },
      'submit #data-form' : function (e) {
        e.preventDefault();
        var email = $('#gravatar-email').val();
        getGravatar(email);
        var gravatarUrl = makeUrl(hash);
        var name = Meteor.user().profile.name;
        
        var playerId = Meteor.users.update (
          { _id: Meteor.userId()}, { $set : {profile: {
            name: name,
            Player :{ 
               Name: $('#github-handle').val(),
               Email: $('#gravatar-email').val(),
               Picture: gravatarUrl,
               Moves: [],
               Room: null,
               Turn: false,
               GithubPoints: 0,
               TwitterPoints: 0
             } } } 
            });
          Session.set("currentUser", playerId);
          $('.alert-success').show();
          Meteor.setTimeout(function(){Router.go('/craft')}, 3000);
        }
    });
        // make calls here to apis returning data to be added to player object.
    Template.craft.created = function() {
      //Call for Github Data Meteor.user needs a name here
      HTTP.call('GET','https://api.github.com/users/' + Meteor.user().profile.Player.Name, function (error,result) {
          var github = result.data;
          if(!error){
            $('#gh-followers').append(github.followers);
            $('#gh-following').append(github.following);
            $('#gh-repos').append(github.public_repos);
            $('#gh-gists').append(github.public_gists);
            var ghPts = github.followers + github.following + github.public_repos + github.public_gists;
            Meteor.users.update (
          { _id: Meteor.userId()}, { $set : {"profile.Player.GithubPoints": ghPts
             } } );
            return true;  
          } 
      });

      Meteor.call("twitterData", function(error, result) {
          var twitter = result.data;
          $('#tw-followers').append(twitter.followers_count);
          $('#tw-following').append(twitter.friends_count);
          $('#tw-tweets').append(twitter.statuses_count);
          $('#tw-retweets').append(twitter.status.retweet_count);
          $('#tw-favorites').append(twitter.favourites_count);
          var twtPts = twitter.followers_count + twitter.friends_count + twitter.statuses_count + twitter.status.retweet_count + twitter.favourites_count;
          Meteor.users.update (
          { _id: Meteor.userId()}, { $set : {"profile.Player.TwitterPoints": twtPts
             } } );
      });  
      
    };
   
    Template.craft.TwitterPoints = function () {
      return Meteor.user().profile.Player.TwitterPoints;
    };

    Template.craft.GithubPoints = function () {
      return Meteor.user().profile.Player.GithubPoints;
    };
   
    Template.craft.events({

      'click .ready' : function () {
        console.log("User: " + Meteor.userId());

        var room = Rooms.findOne({PlayerCount: 1});
        var currentRoom = Meteor.user().profile.Player.Room;

        if(currentRoom) {
          Router.go('game', {param:currentRoom});
        } else {
          if(room) {
            console.log(Rooms);
            Rooms.update(
            {_id: room._id},
              {
                $set: {PlayerCount: 2},
                $push: {Players: Meteor.user()._id}
              }
            );
            Meteor.users.update (
            { _id: Meteor.userId()}, { 
              $set: {
                "profile.Player.Room" : room._id
              }
            });       
            Router.go('game', {param:room._id});

          }else{  
            Rooms.insert({
              PlayerCount: 1,
              Players: [Meteor.user()._id],
              Room : ''
            });
            currentRoom = Rooms.findOne({Players: {$all: [Meteor.userId()]}});

            Meteor.users.update (
            { _id: Meteor.userId()}, { 
              $set: {
                "profile.Player.Room" : currentRoom._id
              }
            });
            Router.go('game', {param:currentRoom._id});

          } 
        }
        var room = Rooms.findOne({PlayerCount: {$lt :2} });
        if(room) {
          room.update({ 
            Players: Meteor.user()
          });
        
        }else{  
          Rooms.insert({
            PlayerCount: 0,
            Players: [],
            Room : ''
          });
        } 
      },

      'click .twitter' : function (e) {
        e.preventDefault();
        Meteor.users.update (Meteor.userId(), { $inc : {'profile.Player.TwitterPoints' : -10}}) //this should be move requirement
        // console.log(Meteor.user().profile.Player.TwitterPoints );
      },

      'click .github' : function (e) {
        e.preventDefault();
        Meteor.users.update (Meteor.userId(), { $inc : {'profile.Player.GithubPoints' : -10}}) //this should be move requirement
      },

      'click .addMove' : function () {
        console.log('hi');
      }

    }); 

    // Game configureation
    Template.players.playersList = function() {
      return Meteor.users.find({"profile.Player.Room" : roomId});
    }

    Template.game.events({
      'click #leaveRoom' : function() {
        var getRoom = Rooms.findOne({_id: roomId});
        if(getRoom.PlayerCount == 2) {
          Rooms.update(
            {_id: roomId}, {
              $pull: {
                Players: Meteor.userId()              
              },
              $set: {
                PlayerCount: 1
              }
            }

          );                
        } else {
          Rooms.remove({_id: roomId});
        }
        Meteor.users.update (
        { _id: Meteor.userId()}, { 
          $set: {
            "profile.Player.Room" : ""
          }
        });    
        Router.go('craft');

      }
    });


    Template.moves.movesList = function () {
      return Moves.find({});
    };
/*********************
Router configurations
********************/
    Router.configure({ 
      layoutTemplate: 'hello'
    });
      
    Router.map(function() { 
      this.route('home', {
        path: '/',
        template: 'home'
      });
      this.route('form', {
        path: '/form',
        template: 'formPage'
      });
      this.route('craft', {
        path: '/craft',
        template: 'craft'
      });
      this.route('game', {
        path: '/game/:param',
        template: 'game',
        action: function() {
          roomId = this.params.param;
          this.render();
        }
      });
    });
  }
/*********************
Meteor on the Server
********************/
  if (Meteor.isServer) {

    Meteor.startup(function () {
      // code to run on server at startup
      Moves.insert({
        Title: 'Git Fork',
        Description : 'Fork your opponents repo and make it better. Deals Damage.',
        TwitterRequirement : 300,
        GithubRequirement : 5,
        ReqsMade: false,
        Used: false,
        Damage: 20
      });
      Moves.insert({
        Title: 'Got Retweeted',
        Description : '@fat retweeted you! Restores Health.',
        TwitterRequirement : 100,
        GithubRequirement : 2,
        ReqsMade: false,
        Used: false,
        Health: 40
      });
      Moves.insert({
        Title: 'Pushed to Master',
        Description : 'You push code to production, You\'re a boss! Deals Damage.',
        TwitterRequirement : 500,
        GithubRequirement : 15,
        ReqsMade: false,
        Used: false,
        Damage: 50
      });
      Moves.insert({
        Title: 'Merge Conflict Resolved',
        Description : 'Resolved a merge conflict. Restores Health.',
        TwitterRequirement : 400,
        GithubRequirement : 3,
        ReqsMade: false,
        Used: false,
        Health: 50
      });
      Moves.insert({
        Title: 'Git Push',
        Description : 'Push your opponent. Deals Damage',
        TwitterRequirement : 100,
        GithubRequirement : 5,
        ReqsMade: false,
        Used: false,
        Damage: 30
      });
      Moves.insert({
        Title: 'Troll',
        Description : 'Left a snarky comment on opponents gist. Deals Damage',
        TwitterRequirement : 100,
        GithubRequirement : 1,
        ReqsMade: false,
        Used: false,
        Damage: 10
      });
      Moves.insert({
        Title: 'Starred Repo',
        Description : 'Someone starred your repo! Restores Health',
        TwitterRequirement : 750,
        GithubRequirement : 10,
        ReqsMade: false,
        Used: false,
        Health: 20
      });
      Moves.insert({
        Title: 'Unfollow',
        Description : 'Unfollow your opponent. Deals Damage',
        TwitterRequirement : 1000,
        GithubRequirement : 3,
        ReqsMade: false,
        Used: false,
        Damage: 20
      });
    });

    Meteor.users.allow({
      'update': function (userId,doc) {
       /* user and doc checks ,
       return true to allow insert */
       return true; 
      }
    });


    // Server side methods
    Meteor.methods({
      twitterData: function () {
        this.unblock(); 
        var twitterHandle = Meteor.user().services.twitter.screenName
        var config = Accounts.loginServiceConfiguration.findOne({service: 'twitter'});
        var base64AuthToken = new Buffer(config.consumerKey + ":" + config.secret).toString('base64');
        var token;
        try {
          token = HTTP.call("POST", "https://api.twitter.com/oauth2/token",
            {
                params: {
                  'grant_type': 'client_credentials'
                },            
                headers: {
                  'Authorization': 'Basic ' + base64AuthToken,
                  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                }             
            }  
          );
          try {
            var result = HTTP.call('GET',
              "https://api.twitter.com/1.1/users/show.json", {
              params : {screen_name: twitterHandle},
              headers : {
                'Authorization': 'Bearer ' + token.data.access_token
              }
            });
            return result; 
          } catch (e) {
            return false;
          }
        } catch (e) {
          // Got a network error, time-out or HTTP error in the 400 or 500 range.
          return false;
        }
      },
      room: function(room) {
        this.unblock();
        var data = {test:"test"};

        return data;
      }          

    });  
  }
})();