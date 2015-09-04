angular.module('starter.services', [])

.factory('Commons', function($http, LocalStorage) {

  var DBNAME = 'pantauharga.db';
  var USERINFO_KEY = 'userInfo';

  var _sms_server = '+14077925761';
  var _api_server = 'http://pantauharga.id/api';
  //var _api_server = 'http://192.168.1.3:18080/PantauHarga/api';
  // var _userinfo = {
  //   identityNo: '3842740923809482309',
  //   mobile: '+6281234567890',
  //   username: 'hackathon@gmail.com'
  // };

  var _items = [
  {
    "id": 8,
    "name": "Beras Medium"
  },
  {
    "id": 9,
    "name": "Beras Pera"
  },
  {
    "id": 10,
    "name": "Beras Premium"
  },
  {
    "id": 15,
    "name": "Daging Sapi Murni"
  },
  {
    "id": 14,
    "name": "Daging Sapi Paha Belakang"
  },
  {
    "id": 12,
    "name": "Gula Pasir"
  }];

  return {
    userInfo: function() {
      return LocalStorage.getObject(USERINFO_KEY);
    },
    offlineItems: function() {
      return _items;
    },
    items: function() {
      return $http.get(_api_server + '/comodityall.json');
    },
    SMSServer: function() {
      return _sms_server;
    },
    APIServer: function() {
      return _api_server;
    },
    updateSMSServer: function(newVal) {
      if (_sms_server != newVal) {
        _sms_server = newVal;
        return true;
      }
      return false;
    },
    updateAPIServer: function(newVal) {
      if (_api_server != newVal) {
        _api_server = newVal;
        return true;
      }
      return false;
    },
    updateUserInfo: function(userInfo) {
      LocalStorage.setObject(USERINFO_KEY, userInfo);
      return true;
    },
    register: function(registration, onSuccess, onError) {
      $http({
        method: 'POST',
        url: _api_server + '/register.json',
        data: {
          nama: registration.name,
          ktp: registration.identityNo,
          nohp: registration.phone,
          email: registration.username,
          username: registration.username,
          alamat: registration.address,
          kodepos: registration.postalCode,
          password: registration.password
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }).success(function() {
        _userinfo = registration;
        if(onSuccess) onSuccess()
      })
      .error(onError);
      return true;
    },
    executeDB: function(query, params) {
	// TODO
	  return true;
    }
  }

})

.service('Webservice', function($http, Commons) {

  var me = this;

  this.urlencode = function(obj) {
      var str = [];
      for(var p in obj) str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      return str.join("&");
  }

  this.input = function(data, onSuccess, onError) {
    $http({
      method: 'POST',
      url: Commons.APIServer() + '/input.json',
      data: data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .success(onSuccess)
    .error(onError);
  }

  this.hargaall = function(data, onSuccess, onError) {
    $http({
      method: 'POST',
      url: Commons.APIServer() + '/hargaall.json',
      data: data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .success(onSuccess)
    .error(onError);
  }

})

.factory('LocalStorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}])

;
