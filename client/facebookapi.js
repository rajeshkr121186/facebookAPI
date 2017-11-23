$(document).ready(function () {
    $("#album").click(function () {
      $("#jumbotron h2").html("Album");
      $("#backArrow").attr("style", "display:none;");
      var userData = JSON.parse(getCookie('userId'));
      getAlbums(function (result) {
        //console.log(result);
        var album = "";
        for (let i = 0; i < result.data.length; i++) {
          album += '<div class="col-md-3"><a class="albumClick" data-value="' + result.data[i]["id"] + '" style="cursor:pointer;">';
          album += '<img src="' + makeFacebookPhotoURL(result.data[i]["cover_photo"]["id"], userData.authResponse.accessToken) + '" class="img-rounded" style="width: 200px;height: 200px;padding: 10px;">';
          album += '</a></div>';
        }
        $("#GaleryList").html(album);
        $(".albumClick").click(function (event) {
          $("#backArrow").attr("style", "display:block;");
          getPhotosForAlbumId($(event.currentTarget).attr("data-value"), function (result, albumPhotosResponse) {
            //console.log(albumPhotosResponse)
            var album = "";
            for (let i = 0; i < albumPhotosResponse.data.length; i++) {
              album += '<div class="col-md-3"><a class="albumClick" data-value="' + albumPhotosResponse.data[i]["id"] + '">';
              album += '<img src="' + makeFacebookPhotoURL(albumPhotosResponse.data[i]["id"], userData.authResponse.accessToken) + '" class="img-rounded" style="width: 200px;height: 200px;padding: 10px;">';
              album += '</a></div>';
            }
            $("#GaleryList").html(album);
          });
        });
      });
    });
    $("#photos").click(function () {
      $("#jumbotron h2").html("Photos");
      $("#backArrow").attr("style", "display:none;");
      getPhotos(function (result) {
        //console.log(result)
        var album = "";
        for (let i = 0; i < result.length; i++) {
          album += '<div class="col-md-3">';
          album += '<img src="' + result[i]["url"] + '" class="img-rounded" style="width: 200px;height: 200px;padding: 10px;">';
          album += '</div>';
        }
        $("#GaleryList").html(album);
      });
    });
    $("#backButtonAlbum").click(function () {
      $("#album").click();
    });
  });
  window.fbAsyncInit = function () {
    FB.init({
      appId: '307117782672642',
      autoLogAppEvents: true,
      xfbml: true,
      version: 'v2.5'
    });
  };

  (function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));

  function checkLoginState() {
    FB.getLoginStatus(function (response) {
      if (response.status === 'connected') {
        //console.log('Logged in.');
        //console.log(response);
        info(function(result){
          console.log(result);
          $("#name").html(result.name);
        });
        setCookie('userId', JSON.stringify(response));
        $("#facebookLogin").attr("style", "display:none;");
      }
      else {
        FB.login(function(response) {
          info(function(result){
            console.log(result);
            $("#name").html(result.name);
          });
          setCookie('userId', JSON.stringify(response));
          $("#facebookLogin").attr("style", "display:none;");
        }, {scope: 'user_birthday, user_religion_politics, user_relationships, user_relationship_details, user_hometown, user_location, user_likes, user_education_history, user_work_history, user_website, user_events, user_photos, user_videos, user_friends, user_about_me, user_status, user_games_activity, email, user_managed_groups, manage_pages, pages_show_list, public_profile'});    
        $("#facebookLogin").attr("style", "display:block;");
      }
    });
  }
  function makeFacebookPhotoURL(id, accessToken) {
    return 'https://graph.facebook.com/' + id + '/picture?access_token=' + accessToken;
  }
  function getAlbums(callback) {
    FB.api(
      '/me/albums',
      { fields: 'id,cover_photo' },
      function (albumResponse) {
        if (callback) {
          callback(albumResponse);
        }
      }
    );
  }
  function info(callback) {
    FB.api(
      '/me/',
      { fields: 'id,name' },
      function (infoResponse) {
        if (callback) {
          callback(infoResponse);
        }
      }
    );
  }
  function permissionReset(callback) {
    FB.api(
      '/me/permissions',
      function (infoResponse) {
        if (callback) {
          callback(infoResponse);
        }
      }
    );
  }
  function getPhotosForAlbumId(albumId, callback) {
    FB.api(
      '/' + albumId + '/photos',
      { fields: 'id' },
      function (albumPhotosResponse) {
        //console.log( ' got photos for album ' + albumId );
        if (callback) {
          callback(albumId, albumPhotosResponse);
        }
      }
    );
  }
  function getLikesForPhotoId(photoId, callback) {
    FB.api(
      '/' + albumId + '/photos/' + photoId + '/likes',
      {},
      function (photoLikesResponse) {
        if (callback) {
          callback(photoId, photoLikesResponse);
        }
      }
    );
  }
  function getPhotos(callback) {
    var allPhotos = [];
    var accessToken = '';
    var userData = JSON.parse(getCookie('userId'));
    accessToken = userData.authResponse.accessToken || '';
    getAlbums(function (albumResponse) {
      var i, album, deferreds = {}, listOfDeferreds = [];
      for (i = 0; i < albumResponse.data.length; i++) {
        album = albumResponse.data[i];
        deferreds[album.id] = $.Deferred();
        listOfDeferreds.push(deferreds[album.id]);
        getPhotosForAlbumId(album.id, function (albumId, albumPhotosResponse) {
          var i, facebookPhoto;
          for (i = 0; i < albumPhotosResponse.data.length; i++) {
            facebookPhoto = albumPhotosResponse.data[i];
            allPhotos.push({
              'id': facebookPhoto.id,
              'added': facebookPhoto.created_time,
              'url': makeFacebookPhotoURL(facebookPhoto.id, accessToken)
            });
          }
          deferreds[albumId].resolve();
        });
      }
      $.when.apply($, listOfDeferreds).then(function () {
        if (callback) {
          callback(allPhotos);
        }
      }, function (error) {
        if (callback) {
          callback(allPhotos, error);
        }
      });
    });
  }
  function setCookie(key, value) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
    document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
  }
  function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
  }
  function loginWithFullPermission(){
    FB.login(function(response) {
      info(function(result){
        console.log(result);
        $("#name").html(result.name);
      });
      setCookie('userId', JSON.stringify(response));
      $("#facebookLogin").attr("style", "display:none;");
    }, {scope: 'user_birthday, user_religion_politics, user_relationships, user_relationship_details, user_hometown, user_location, user_likes, user_education_history, user_work_history, user_website, user_events, user_photos, user_videos, user_friends, user_about_me, user_status, user_games_activity, email, user_managed_groups, manage_pages, pages_show_list, public_profile'});
  }