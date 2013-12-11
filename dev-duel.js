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
  var otherPlayer;
  var moveMsg;
  
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
    Session.set("moveTxt", "");    
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
        var emailpattern = /^[a-zA-Z0-9_.,]+@[a-zA-Z0-9_]+(\.([a-zA-Z0-9_]{2,3})+)+$/;

        var messages = "";
             
        if (!emailpattern.test($("#gravatar-email").val())) {
            // when doesnt match
            messages += ("\n Email address should be fully valid email address \n (eg. someone@somewhere.com");
        }

        //Call for Github Data Meteor.user needs a name here
          HTTP.call('GET','https://api.github.com/users/' + $("#github-handle").val(), function(error, result){
            if(!error) {
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
                     TwitterPoints: 0,
                     Health: 100
                   } } } 
                  });
                Session.set("currentUser", playerId);
                $('.alert-success').show();

                Router.go('/craft');
            } else {
              messages += ("\n GitHub account not available");
              alert(messages);
            } 
          });
       




      }
    });
        // make calls here to apis returning data to be added to player object.
    Template.craft.created = function() {
      Meteor.call("insertMoves");

      var getMoves = Moves.find({UserId:Meteor.userId()});
      var twitterPoints = 0;
      var githubPoints = 0;
      getMoves.forEach(function(moves){
        if(moves.Added) {
          twitterPoints += moves.TwitterRequirement;
          githubPoints += moves.GithubRequirement;
        }
      });

      //Call for Github Data Meteor.user needs a name here

      HTTP.call('GET','https://api.github.com/users/' + Meteor.user().profile.Player.Name, function (error,result) {
          var github = result.data;
          if(!error){
            $('#gh-followers span').html(github.followers);
            $('#gh-following span').html(github.following);
            $('#gh-repos span').html(github.public_repos);
            $('#gh-gists span').html(github.public_gists);
            var ghPts = github.followers + github.following + github.public_repos + github.public_gists;
            Meteor.users.update (
          { _id: Meteor.userId()}, { $set : {"profile.Player.GithubPoints": ghPts
             } } );
            Meteor.users.update (Meteor.userId(), { $inc : {'profile.Player.GithubPoints' : -githubPoints}}) //this should be move requirement

            return true;  
          } 
      });   
      // Call twitter data      
      Meteor.call("twitterData", function(error, result) {
          var twitter = result.data;
          $('#tw-followers span').html(twitter.followers_count);
          $('#tw-following span').html(twitter.friends_count);
          $('#tw-tweets span').html(twitter.statuses_count);
          $('#tw-retweets span').html(twitter.status.retweet_count);
          $('#tw-favorites span').html(twitter.favourites_count);
          var twtPts = twitter.followers_count + twitter.friends_count + twitter.statuses_count + twitter.status.retweet_count + twitter.favourites_count;
          Meteor.users.update (
          { _id: Meteor.userId()}, { $set : {"profile.Player.TwitterPoints": twtPts
             } } );
          Meteor.users.update (Meteor.userId(), { $inc : {'profile.Player.TwitterPoints' : -twitterPoints}}) //this should be move requirement

      });

    };


    /*********************
    Handlebars helpers
    ********************/
    Template.moves.moveAdded = function(bool) {
      return this.Added == bool;
    };    
   
    Template.craft.TwitterPoints = function () {
      Meteor.call("twitterData", function(error, result) {
          var twitter = result.data;
          $('#tw-followers span').html(twitter.followers_count);
          $('#tw-following span').html(twitter.friends_count);
          $('#tw-tweets span').html(twitter.statuses_count);
          $('#tw-retweets span').html(twitter.status.retweet_count);
          $('#tw-favorites span').html(twitter.favourites_count);
      });   

      return Meteor.user().profile.Player.TwitterPoints;
    };

    Template.craft.GithubPoints = function () {
      //Call for Github Data Meteor.user needs a name here
      HTTP.call('GET','https://api.github.com/users/' + Meteor.user().profile.Player.Name, function (error,result) {
          var github = result.data;
          if(!error){
            $('#gh-followers span').html(github.followers);
            $('#gh-following span').html(github.following);
            $('#gh-repos span').html(github.public_repos);
            $('#gh-gists span').html(github.public_gists);
            return true;  
          } 
      });      
      return Meteor.user().profile.Player.GithubPoints;
    };
   
    Template.craft.events({

      'click .ready' : function () {
        console.log("User: " + Meteor.userId());

        var room = Rooms.findOne({PlayerCount: 1});
        var currentRoom = Meteor.user().profile.Player.Room;
        var findRoom = Rooms.findOne({_id: currentRoom});

        if(currentRoom && findRoom) {
          Router.go('game', {param:currentRoom});
        } else if(currentRoom) {
          Meteor.users.update({_id:Meteor.userId()}, {
            $set:{
              "profile.Player.Room":""
            }
          })
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
                "profile.Player.Room" : room._id,
              }
            });       
            Router.go('game', {param:room._id});

          }else{  
            Rooms.insert({
              PlayerCount: 1,
              Players: [Meteor.user()._id],
              Turn : Meteor.userId()
            });
            currentRoom = Rooms.findOne({Players: {$all: [Meteor.userId()]}});

            Meteor.users.update (
            { _id: Meteor.userId()}, { 
              $set: {
                "profile.Player.Room" : currentRoom._id,
              }
            });
            Router.go('game', {param:currentRoom._id});

          } 
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

      'click .addMove' : function (e) {
        e.preventDefault();

        var checkMoves = Moves.find({UserId: Meteor.userId(), Added: true});
        
        if(checkMoves.count() < 4) {
          var twitterPoints = parseInt($(e.currentTarget).attr('data-twitter'));
          var githubPoints = parseInt($(e.currentTarget).attr('data-github'));
          var moveId = $(e.currentTarget).attr('data-id');
          Meteor.users.update(Meteor.userId(), {
            $inc: {
              'profile.Player.TwitterPoints' : -twitterPoints,
              'profile.Player.GithubPoints' : -githubPoints
            }
          });
          Moves.update({_id:moveId}, {
            $set: {
              Added: true
            }
          });
        } else {
          alert("You already added 4 moves!");
        }

      },
      'click .removeMove' : function (e) {
        e.preventDefault();
        var twitterPoints = parseInt($(e.currentTarget).attr('data-twitter'));
        var githubPoints = parseInt($(e.currentTarget).attr('data-github'));
        var moveId = $(e.currentTarget).attr('data-id');
        Meteor.users.update(Meteor.userId(), {
          $inc: {
            'profile.Player.TwitterPoints' : +twitterPoints,
            'profile.Player.GithubPoints' : +githubPoints
          }
        });
        Moves.update({_id:moveId}, {
          $set: {
            Added: false
          }
        });
      }

    }); 

    // Game configureation
    Template.players.playersList = function() {

      return Meteor.users.find({"profile.Player.Room" : roomId});
    }
    Template.players.currentTurn = function(id) {
      var getUser = Meteor.user();
      var getRoom = Rooms.findOne({_id:roomId});
      if(getRoom.Turn == id && Meteor.userId() != id) {
        return "currentPlayer notSelf";
      } else if(getRoom.Turn == id) {
        return "currentPlayer";

      }
    }

    Template.players.winLose = function(health, options) {
      if(health <= 0) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }

    Template.game.alert = function() {
      var getRoom = Rooms.findOne({_id:roomId});
      var getUser = Meteor.users.findOne({_id:getRoom.Turn});

      if(getRoom.PlayerCount != 2) {
        return "Waiting for another player";
      }
      else if(getRoom.Turn == Meteor.userId()) {
        return "My Turn";
      } else {
        return getUser.profile.name + "'s Turn";        
      }

    }

    Template.game.moveAlert = function() {
      return Session.get("moveTxt");
    }

    Template.game.rendered = function() {
        var getRoom = Rooms.findOne({_id: roomId});
        var getPlayers = getRoom.Players;
       if(getRoom.PlayerCount == 2) {
          for(var i=0;i<2;i++) {
            if(getPlayers[i] != Meteor.userId()) {
              otherPlayer = getPlayers[i];
            }
          } 
        }      
    }

    Template.game.events({
      'click #leaveRoom' : function() {

        Meteor.call("resetUsed", Meteor.userId());
        Meteor.call("resetUsed", otherPlayer);

        var getRoom = Rooms.findOne({_id: roomId});
        if(getRoom.PlayerCount == 2) {
          Rooms.update(
            {_id: roomId}, {
              $pull: {
                Players: Meteor.userId()              
              },
              $set: {
                PlayerCount: 1,
                Turn: otherPlayer
              }
            }

          );                
        } else {
          Rooms.remove({_id: roomId});
        }
        Meteor.users.update (
        { _id: Meteor.userId()}, { 
          $set: {
            "profile.Player.Room" : "",
            "profile.Player.Health" : 100                
          }
        });
        Meteor.users.update({_id:otherPlayer},{
          $set: {
            "profile.Player.Health" : 100
          }
        });

        Router.go('craft');

      },
      'click .gameMoves' : function(e) {
        e.preventDefault();
        if($(e.currentTarget).css("cursor") != "default") {
          var title = $(e.currentTarget).attr('data-title');
          var damage = parseInt($(e.currentTarget).attr('data-damage'));
          var health = parseInt($(e.currentTarget).attr('data-health'));
          var id = $(e.currentTarget).attr('data-id');
          var damageOrHealth;
          if(damage) {
            damageOrHealth = " (Damage: "+damage+")";
          } else {
            damageOrHealth = " (Health: "+health+")";
          }

          Session.set("moveTxt", Meteor.user().profile.name + " used "+title+damageOrHealth);

          Moves.update({_id:id}, {
            $set: {
              Used: true
            }
          });

          if(damage) {
            Meteor.users.update({_id:otherPlayer},{
              $inc: {
                "profile.Player.Health" : -damage
              }
            });
          } else {
            if((Meteor.user().profile.Player.Health + health)>100) {
              health = 100 - Meteor.user().profile.Player.Health;
            }
            Meteor.users.update({_id:Meteor.userId()},{
              $inc: {
                "profile.Player.Health" : +health
              }
            });
          }

          var turnUpdate;
          var currentTurn = Rooms.findOne({_id:roomId}).Turn;
          console.log(currentTurn);
          if(currentTurn == Meteor.userId()) {
            Rooms.update({_id:roomId}, {
              $set: {
                Turn: otherPlayer
              }
            });
          }
        }


      }
    });


    Template.moves.movesList = function () {

      var getUser = Meteor.user();

      var getMoves = Moves.find({UserId: Meteor.userId()});
      getMoves.forEach(function(moves){
        if(getUser.profile.Player.TwitterPoints > moves.TwitterRequirement && getUser.profile.Player.GithubPoints > moves.GithubRequirement) {
          Moves.update({_id: moves._id}, {
            $set: {
              ReqsMade: true
            }
          });
        } else if((getUser.profile.Player.TwitterPoints < moves.TwitterRequirement || getUser.profile.Player.GithubPoints < moves.GithubRequirement) && moves.Added == false) {
          Moves.update({_id: moves._id}, {
            $set: {
              ReqsMade: false
            }
          });
        }
      });
      return Moves.find({UserId: Meteor.userId()});
    };

    Template.myMoves.myMovesList = function () {

      return Moves.find({UserId: Meteor.userId(), Added: true});
    };


    Template.players.gameMovesList = function (id, options) {
      var getMoves = Moves.find({UserId: id, Used: true});
      if(getMoves && getMoves.count() == 4) {
        getMoves.forEach(function(move){
          Moves.update({_id: move._id},{
            $set: {
              Used: false
            }
          })
        });
      }

      return Moves.find({UserId: id, Added: true});
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
      },
      resetUsed: function(id) {
        var getMoves = Moves.find({UserId: id, Used: true});
        if(getMoves) {
          getMoves.forEach(function(move){
            Moves.update({_id: move._id},{
              $set: {
                Used: false
              }
            })
          });
        }
      },
      insertMoves: function() {
        var moveFind = Moves.find({"UserId": Meteor.userId()});
        if(moveFind.count() == 0) {
            Moves.insert({
              Title: 'Git Fork',
              Description : 'Fork your opponents repo and make it better. Deals Damage.',
              TwitterRequirement : 300,
              GithubRequirement : 5,
              ReqsMade: false,
              Used: false,
              Added: false,
              Damage: 20,
              UserId: Meteor.userId()
            });
            Moves.insert({
              Title: 'Got Retweeted',
              Description : '@fat retweeted you! Restores Health.',
              TwitterRequirement : 600,
              GithubRequirement : 2,
              ReqsMade: false,
              Used: false,
              Added: false,
              Health: 40,
              UserId: Meteor.userId()
            });
            Moves.insert({
              Title: 'Pushed to Master',
              Description : 'You push code to production, You\'re a boss! Deals Damage.',
              TwitterRequirement : 500,
              GithubRequirement : 15,
              ReqsMade: false,
              Used: false,
              Added: false,
              Damage: 50,
              UserId: Meteor.userId()
            });
            Moves.insert({
              Title: 'Merge Conflict Resolved',
              Description : 'Resolved a merge conflict. Restores Health.',
              TwitterRequirement : 400,
              GithubRequirement : 3,
              ReqsMade: false,
              Used: false,
              Added: false,
              Damage: 20,
              UserId: Meteor.userId()
            });
            Moves.insert({
              Title: 'Git Push',
              Description : 'Push your opponent. Deals Damage',
              TwitterRequirement : 100,
              GithubRequirement : 5,
              ReqsMade: false,
              Used: false,
              Added: false,
              Damage: 30,
              UserId: Meteor.userId()
            });
            Moves.insert({
              Title: 'Troll',
              Description : 'Left a snarky comment on opponents gist. Deals Damage',
              TwitterRequirement : 100,
              GithubRequirement : 1,
              ReqsMade: false,
              Used: false,
              Added: false,
              Damage: 10,
              UserId: Meteor.userId()
            });
            Moves.insert({
              Title: 'Starred Repo',
              Description : 'Someone starred your repo! Restores Health',
              TwitterRequirement : 750,
              GithubRequirement : 10,
              ReqsMade: false,
              Used: false,
              Added: false,
              Health: 20,
              UserId: Meteor.userId()
            });
            Moves.insert({
              Title: 'Unfollow',
              Description : 'Unfollow your opponent. Deals Damage',
              TwitterRequirement : 1000,
              GithubRequirement : 3,
              ReqsMade: false,
              Used: false,
              Added: false,
              Damage: 20,
              UserId: Meteor.userId()
            });        
        }        
      }

    });  

  }
})();