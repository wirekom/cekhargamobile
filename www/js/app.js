// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova'])

.run(function($ionicPlatform, Commons, LocalStorage) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
    // cek user info in localstorage
    var userInfo = LocalStorage.getObject('userInfo');
    try {
      if ((!userInfo || !userInfo.mobile) && window.plugins.phonenumber) {
        window.plugins.phonenumber.get(function(res) {
          if (!userInfo) {
            userInfo = {mobile: res};
          } else {
            userInfo.mobile = res;
          }
          LocalStorage.setObject('userInfo', userInfo);
        });
      }
    } catch (err) {
      console.error(err);
      LocalStorage.setObject('userInfo', {});
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  // set tabs to bottom
  //$ionicConfigProvider.tabs.position('bottom');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  /* Cek harga! */

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  })

  .state('tab.cek-harga', {
    url: '/cek-harga',
    views: {
      'tab-cek-harga': {
        templateUrl: 'templates/cek-harga.html',
        controller: 'CekHargaCtrl'
      }
    }
  })

  .state('tab.pos-harga', {
    url: '/pos-harga',
    views: {
      'tab-pos-harga': {
        templateUrl: 'templates/pos-harga.html',
        controller: 'PosHargaCtrl'
      }
    }
  })

  .state('tab.jual', {
    url: '/jual',
    views: {
      'tab-jual': {
        templateUrl: 'templates/tab-jual.html',
        controller: 'JualCtrl'
      }
    }
  })
  ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/cek-harga');

});
