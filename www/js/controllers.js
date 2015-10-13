angular.module('starter.controllers', ['ngCordova','ionic'])

.controller('AccountCtrl', function($scope, $ionicModal, $ionicLoading, $ionicPopup, Commons, LocalStorage, Webservice) {
  $scope.userInfo = {};
  $scope.registration = {};
  $scope.config = {
    SMSServer: Commons.SMSServer(),
    APIServer: Commons.APIServer()
  };

  $ionicModal.fromTemplateUrl('register-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $ionicModal.fromTemplateUrl('register-view-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.viewModal = modal;
  });

  $ionicModal.fromTemplateUrl('about-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.aboutModal = modal;
  });

  $ionicModal.fromTemplateUrl('login-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.loginModal = modal;
  });

  $scope.$on('$destroy', function() {
    $scope.modal.remove();
    $scope.viewModal.remove();
    $scope.aboutModal.remove();
    $scope.loginModal.remove();
  });

  $scope.init = function() {
    $scope.userInfo = LocalStorage.getObject('userInfo');
    $scope.userInfo.mobileAvailable = ($scope.registration && $scope.registration.mobile && $scope.registration.mobile.length > 0);
  }

  $scope.openModal = function() {
    $scope.modal.show();
  }

  $scope.closeModal = function() {
    $scope.modal.hide();
  }

  $scope.register = function() {
    // validate
    if ($scope.registration.password != $scope.registration.passwordConfirm) {
      $ionicPopup.alert({title:'Data tidak valid', template:'Kata sandi tidak sama'}).then(function(res) {});
      return false;
    }
    $ionicLoading.show();
    Webservice.register({
      username: $scope.registration.username,
      email: $scope.registration.username,
      password: $scope.registration.password,
      ktp: $scope.registration.identityNo,
      nama: $scope.registration.name,
      nohp: $scope.registration.mobile,
      alamat: $scope.registration.address,
      kodepos: $scope.registration.postalCode
    }, function(res) {
      LocalStorage.setObject('userInfo', $scope.registration);
      $scope.userInfo = $scope.registration;
      $ionicPopup.alert({title:'Registrasi berhasil!', template:'Registrasi berhasil. Sekarang Anda dapat menggunakan menu Jual Komoditi.'}).then(function(res) {});
      $scope.modal.hide();
      $ionicLoading.hide();
    }, function(err) {
      var errMsg = err.errors.errors.join('<br>');
      $ionicPopup.alert({title:'Registrasi gagal', template:errMsg}).then(function(res) {});
      $ionicLoading.hide();
    });
  }

  $scope.openViewModal = function() {
    $scope.viewModal.show();
  }

  $scope.closeViewModal = function() {
    $scope.viewModal.hide();
  }

  $scope.openAboutModal = function() {
    $scope.aboutModal.show();
  }

  $scope.closeAboutModal = function() {
    $scope.aboutModal.hide();
  }

  $scope.login = function() {
    $ionicLoading.show();
    Webservice.login({
      username: $scope.login.username,
      password: $scope.login.password
    }, function(res) {
      $scope.userInfo.username = res.username;
      $scope.userInfo.identityNo = res.ktp;
      $scope.userInfo.name = res.nama;
      $scope.userInfo.mobile = res.nohp;
      $scope.userInfo.address = res.alamat;
      $scope.userInfo.postalCode = res.kodepos;
      LocalStorage.setObject('userInfo', $scope.userInfo);
      $ionicPopup.alert({title:'Login berhasil!', template:'Selamat datang kembali, ' + res.nama + ' ! '}).then(function(res) {});
      $scope.loginModal.hide();
      $ionicLoading.hide();
    }, function(err) {
      var errMsg = err.errors.errors.join('<br>');
      $ionicPopup.alert({title:'Login gagal', template:errMsg}).then(function(res) {});
      $ionicLoading.hide();
    });
  }

  $scope.openLoginModal = function() {
    $scope.loginModal.show();
  }

  $scope.closeLoginModal = function() {
    $scope.loginModal.hide();
  }

  $scope.logout = function() {
    $ionicPopup.confirm({
     title: 'Logout',
     template: 'Logout dari akun ' + $scope.userInfo.username + '?'
   }).then(function(res) {
     if(res) {
       $scope.userInfo = {};
       $scope.registration = {};
       LocalStorage.setObject('userInfo', null);
     }
   });
  }

})

.controller('CekHargaCtrl', function($scope, $state, $ionicLoading, $cordovaSms, $ionicPlatform, $ionicModal, $ionicPopup, Commons, Webservice) {

  // set options
  var DEFAULT_RADIUS = 10;
  Commons.items().success(function(data) {
    $scope.items = data;
    $scope.selection = {
      item: ($scope.items.length > 0) ? $scope.items[0].id : null,
      radius: DEFAULT_RADIUS
    };
  }).error(function() {
    $scope.items = Commons.offlineItems();
    $scope.selection = {
      item: ($scope.items.length > 0) ? $scope.items[0].id : null,
      radius: DEFAULT_RADIUS
    };
  });
  $scope.currentPosition = null;
  $scope.map = null;
  $scope.markers = [];
  $scope.registration = {};

  $scope.onPositionFound = function(position) {
    var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    $scope.currentPosition = myLatlng;
    var marker = new google.maps.Marker({
      position: myLatlng,
      map: $scope.map,
      title: 'Posisi Anda'
    });
    var infowindow = new google.maps.InfoWindow({
      content: marker.title
    }).open($scope.map, marker);
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open($scope.map,marker);
    });
    $scope.map.setCenter(myLatlng);
  }

  $scope.onPositionError = function(err) {
    $ionicPopup.alert({title:'Error', template:'Lokasi tidak berhasil dideteksi. Silahkan pastikan GPS Anda aktif'}).then(function(res) {});
    //alert('Lokasi tidak berhasil dideteksi : ' + err.message + ' (' + err.code + ')');
  }

  $scope.getUserCurrentLocation = function(options, callback) {
    navigator.geolocation.getCurrentPosition(function(position) {
      $scope.onPositionFound(position);
      if (callback) callback();
    },
    function(err) {
      options.enableHighAccuracy = true; // force to use GPS
      navigator.geolocation.getCurrentPosition($scope.onPositionFound, $scope.onPositionError, options);
    },
    options);
  }

  $scope.init = function() {
    $scope.map = new google.maps.Map(document.getElementById('map'), {zoom: 16,mapTypeId: google.maps.MapTypeId.ROADMAP});
    $scope.getUserCurrentLocation(
      {maximumAge: 30000, timeout: 5000, enableHighAccuracy: false}
    );
    // add map control
    addMapControl($scope.map, function() {
      $scope.map.setCenter($scope.currentPosition);
    });
  }

  $scope.getPrice = function(source) {
    if ($scope.selection.item) {

      var name = null;
      for (var i=0;i<$scope.items.length;i++) {
        if ($scope.items[i].id == $scope.selection.item) {
          name = $scope.items[i].name;
          break;
        }
      }

      if ('WEB' == source) {

        // handle undetected number
        //if(isUndetectedNumber(Commons.userInfo().mobile, $ionicPopup, $state)) return false;

        //var content = {name: name, radius: $scope.selection.radius, lat: $scope.currentPosition.lat(), lng: $scope.currentPosition.lng(), nohp: Commons.userInfo().mobile};
        var content = {name: name, radius: $scope.selection.radius, lat: $scope.currentPosition.lat(), lng: $scope.currentPosition.lng()};
        console.log(JSON.stringify(content));

        // to do dummy
        // $scope.addMarkers([
        //   {lat:'-6.919120523384683', lng:'107.61046171188354', price:8000, item:'Beras premium'},
        //   {lat:'-6.913709936771518', lng:'107.61099815368652', price:9000, item:'Beras premium'},
        //   {lat:'-6.916521745423941', lng:'107.61863708496094', price:10000, item:'Beras premium'},
        //   {lat:'-6.919397441504497', lng:'107.62271404266357', price:8500, item:'Beras premium'}
        // ]);

        $ionicLoading.show();
        Webservice.hargaall(
          content,
          function(res) {
            //alert(JSON.stringify(res));
            $scope.addMarkers(res);
            $ionicLoading.hide();
          },
          function(err) {
            $ionicPopup.alert({title:'Data gagal diunduh', template:err}).then(function(res) {});
            //alert(err);
            $ionicLoading.hide();
          }
        );

      } else if ('SMS' == source) {
        var phonenumber = Commons.SMSServer();
        var content = 'CEKHARGA,' + $scope.selection.item + ',' + name + ',' + $scope.selection.radius + ',' + $scope.currentPosition.lat() + ',' + $scope.currentPosition.lng();
        console.log(content);
        $ionicLoading.show();
        try {
          $ionicPlatform.ready(function() {
            $cordovaSms
            .send(phonenumber, content)
            .then(function() {
              $ionicPopup.alert({title:'SMS berhasil dikirim', template:'SMS berhasil dikirim. SMS balasan berisi info harga sedang dikirim'}).then(function(res) {});
              //alert('SMS berhasil dikirim')
              $ionicLoading.hide();
            }, function(err) {
              $ionicPopup.alert({title:'Pengiriman SMS gagal', template:err}).then(function(res) {});
              // alert('SMS gagal dikirim: ' + err);
              $ionicLoading.hide();
            });
          });
        } catch(err) {
          $ionicPopup.alert({title:'Pengiriman SMS gagal', template:err}).then(function(res) {});
          //alert(err);
          $ionicLoading.hide();
        }
      }
    }
  }

  $scope.addMarkers = function(locations) {
    $scope.clearMarkers();
    for (var i=0;i<locations.length;i++) {
      var markerTitle = '<div>' + locations[i].barang + '</div><div>Rp ' + numeral(locations[i].price).format('0,0.00') + '/Kg</div>';
      if (locations[i].nohp && locations[i].nohp.length > 5) markerTitle += '<div>Telp: ' + locations[i].nohp + '</div>';
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(locations[i].latitude, locations[i].longitude),
        map: $scope.map,
        icon: {url:'http://maps.google.com/mapfiles/kml/paddle/grn-circle.png', scaledSize:new google.maps.Size(40, 40)},
        animation: google.maps.Animation.DROP
      });
      var infowindow = new google.maps.InfoWindow({
        content: markerTitle
      }).open($scope.map, marker);
      $scope.markers.push(marker);
    }
  }

  $scope.clearMarkers = function() {
    for ( var i = 0; i < $scope.markers.length; i++) {
      $scope.markers[i].setMap(null);
    }
    $scope.markers = [];
  }

  $scope.$on('$ionicView.enter', function(){
    $scope.init();
  });

})

.controller('PosHargaCtrl', function($scope, $state, $ionicLoading, $ionicPlatform, $ionicPopup, $cordovaSms, Commons, Webservice) {
  // set options
  Commons.items().success(function(data) {
    $scope.items = data;
    $scope.selection = {
      item: ($scope.items.length > 0) ? $scope.items[0].id : null,
      price: null
    };
  }).error(function() {
    $scope.items = Commons.offlineItems();
    $scope.selection = {
      item: ($scope.items.length > 0) ? $scope.items[0].id : null,
      price: null
    };
  });
  $scope.source = null;
  $scope.currentPosition = null;
  $scope.currentMarker = null;
  $scope.map = null;

  $scope.sendPrice = function(source) {
    $scope.source = source;
    if ('WEB' == $scope.source) {
      // handle undetected number
      if(isUndetectedNumber(Commons.userInfo().mobile, $ionicPopup, $state)) return false;
      var content = {id: $scope.selection.item, harga: $scope.selection.price, quantity:0, lat: $scope.currentPosition.lat(), lng: $scope.currentPosition.lng(), nohp: Commons.userInfo().mobile};
      console.log(JSON.stringify(content));
      $ionicLoading.show();
      Webservice.input(
        content,
        function(res) {
          console.log(JSON.stringify(res));
          $ionicLoading.hide();
          $ionicPopup.alert({title:'Data berhasil diunggah', template:'Data berhasil diunggah. Terimakasih atas partisipasi Anda memantau harga!'}).then(function(res) {});
        },
        function(err) {
          $ionicPopup.alert({title:'Data gagal diunggah', template:err}).then(function(res) {});
          $ionicLoading.hide();
        }
      );
    } else if ('SMS' == $scope.source) {
      var phonenumber = Commons.SMSServer();
      var content = 'POSHARGA,' + $scope.selection.item + ',' + $scope.selection.price + ',' + $scope.currentPosition.lat() + ',' + $scope.currentPosition.lng();
      console.log(content);
      $ionicLoading.show();
      try {
        $ionicPlatform.ready(function() {
          $cordovaSms
          .send(phonenumber, content)
          .then(function() {
            $ionicPopup.alert({title:'SMS berhasil dikirim', template:'SMS berhasil dikirim. Terimakasih atas partisipasi Anda memantau harga!'}).then(function(res) {});
            //alert('SMS berhasil dikirim')
            $ionicLoading.hide();
          }, function(err) {
            $ionicPopup.alert({title:'SMS gagal dikirim', template:err}).then(function(res) {});
            //alert('SMS gagal dikirim: ' + err);
            $ionicLoading.hide();
          });
        });
      } catch(err) {
        $ionicPopup.alert({title:'SMS gagal dikirim', template:err}).then(function(res) {});
        //alert(err);
        $ionicLoading.hide();
      }
    }
  }


  $scope.onPositionError = function(err) {
    $ionicPopup.alert({title:'Lokasi gagal dideteksi', template:'Lokasi tidak berhasil dideteksi. Silahkan pastikan GPS Anda aktif'}).then(function(res) {});
    //alert('Lokasi tidak berhasil dideteksi : ' + err.message + ' (' + err.code + ')');
    $ionicLoading.hide();
  }

  $scope.onPositionFound = function(position) {
    var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    $scope.currentPosition = myLatlng;
    var marker = new google.maps.Marker({
      position: myLatlng,
      map: $scope.map,
      title: 'Posisi Anda'
    });
    var infowindow = new google.maps.InfoWindow({
      content: marker.title
    }).open($scope.map, marker);
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open($scope.map,marker);
    });
    $scope.map.setCenter(myLatlng);
    $scope.currentMarker = marker;
  }

  $scope.getUserCurrentLocation = function(options, callback) {
    navigator.geolocation.getCurrentPosition($scope.onPositionFound,
      function(err) {
        options.enableHighAccuracy = true; // force to use GPS
        navigator.geolocation.getCurrentPosition($scope.onPositionFound, $scope.onPositionError, options);
        if (callback) callback();
      },
      options);
    }

    $scope.init = function() {
      $scope.map = new google.maps.Map(document.getElementById('map'), {zoom: 16,mapTypeId: google.maps.MapTypeId.ROADMAP});
      $scope.getUserCurrentLocation(
        {maximumAge: 30000, timeout: 5000, enableHighAccuracy: false}
      );

      // on map click handler
      google.maps.event.addListener($scope.map, 'mousedown', function(e) {
        if ($scope.currentMarker) {
          $scope.currentMarker.setMap(null);
          $scope.currentMarker = null;
          $scope.currentPosition = e.latLng;
          var marker = new google.maps.Marker({
            position: $scope.currentPosition,
            map: $scope.map,
            title: 'Posisi (' + $scope.currentPosition.lat() + ', ' +  $scope.currentPosition.lng() + ')'
          });
          var infowindow = new google.maps.InfoWindow({
            content: marker.title
          }).open($scope.map, marker);
          $scope.currentMarker = marker;
        }
      });

    }

    $scope.$on('$ionicView.enter', function(){
      $scope.init();
    });

  })

  .controller('JualCtrl', function($scope, $state, $ionicLoading, $ionicPlatform, $ionicPopup, $cordovaSms, Commons, Webservice) {
    // set options
    Commons.items().success(function(data) {
      $scope.items = data;
      $scope.selection = {
        item: ($scope.items.length > 0) ? $scope.items[0].id : null,
        price: null
      };
    }).error(function() {
      $scope.items = Commons.offlineItems();
      $scope.selection = {
        item: ($scope.items.length > 0) ? $scope.items[0].id : null,
        price: null
      };
    });
    $scope.source = null;
    $scope.currentPosition = null;
    $scope.map = null;

    $scope.sendPrice = function(source) {
      $scope.source = source;
      if ('WEB' == $scope.source) {
        // handle undetected number
        if(isUndetectedNumber(Commons.userInfo().mobile, $ionicPopup, $state)) return false;
        var content = {id: $scope.selection.item, quantity: $scope.selection.qty, harga: $scope.selection.price, lat: $scope.currentPosition.lat(), lng: $scope.currentPosition.lng(), nohp: Commons.userInfo().mobile};
        console.log(JSON.stringify(content));
        $ionicLoading.show();
        Webservice.input(
          content,
          function(res) {
            console.log(JSON.stringify(res));
            $ionicPopup.alert({title:'Data berhasil diunggah', template:'Data berhasil diunggal. Terimakasih atas partisipasi Anda!'}).then(function(res) {});
            //alert('Data berhasil dikirim');
            $ionicLoading.hide();
          },
          function(err) {
            $ionicPopup.alert({title:'Data gagal diunggah', template:err}).then(function(res) {});
            //alert(err);
            $ionicLoading.hide();
          }
        );

      } else if ('SMS' == $scope.source) {
        var phonenumber = Commons.SMSServer();
        var content = 'JUAL,' + $scope.selection.item + ',' + $scope.selection.qty + ',' + $scope.selection.price + ',' + $scope.currentPosition.lat() + ',' + $scope.currentPosition.lng();
        console.log(content);
        $ionicLoading.show();
        try {
          $ionicPlatform.ready(function() {
            $cordovaSms
            .send(phonenumber, content)
            .then(function() {
              $ionicPopup.alert({title:'SMS berhasil dikirim', template:'SMS berhasil dikirim. Terimakasih atas partisipasi Anda!'}).then(function(res) {});
              //alert('SMS berhasil dikirim')
              $ionicLoading.hide();
            }, function(error) {
              $ionicPopup.alert({title:'SMS gagal dikirim', template:err}).then(function(res) {});
              //alert('SMS gagal dikirim: ' + error);
              $ionicLoading.hide();
            });
          });
        } catch(err) {
          $ionicPopup.alert({title:'SMS gagal dikirim', template:err}).then(function(res) {});
          //alert(err);
          $ionicLoading.hide();
        }
      }

    }

    $scope.onPositionError = function(err) {
      $ionicPopup.alert({title:'Lokasi tidak berhasil dideteksi', template:'Lokasi tidak berhasil dideteksi. Silahkan pastikan GPS Anda aktif'}).then(function(res) {});
      //alert('Lokasi tidak berhasil dideteksi : ' + err.message + ' (' + err.code + ')');
      $ionicLoading.hide();
    }

    $scope.onPositionFound = function(position) {
      var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      $scope.currentPosition = myLatlng;
      var marker = new google.maps.Marker({
        position: myLatlng,
        map: $scope.map,
        title: 'Posisi Anda'
      });
      var infowindow = new google.maps.InfoWindow({
        content: marker.title
      }).open($scope.map, marker);
      google.maps.event.addListener(marker, 'click', function() {
        infowindow.open($scope.map,marker);
      });
      $scope.map.setCenter(myLatlng);
    }

    $scope.getUserCurrentLocation = function(options) {
      navigator.geolocation.getCurrentPosition($scope.onPositionFound,
        function(err) {
          options.enableHighAccuracy = true; // force to use GPS
          navigator.geolocation.getCurrentPosition($scope.onPositionFound, $scope.onPositionError, options);
        },
        options);
      }

      $scope.init = function() {

        $scope.map = new google.maps.Map(document.getElementById('map'), {zoom: 16,mapTypeId: google.maps.MapTypeId.ROADMAP});
        $scope.getUserCurrentLocation(
          {maximumAge: 30000, timeout: 5000, enableHighAccuracy: false}
        );
        $scope.loggedIn = Commons.userInfo().username != null; // TODO call API

        // add map control
        addMapControl($scope.map, function() {
          $scope.map.setCenter($scope.currentPosition);
        });

      }

      $scope.$on('$ionicView.enter', function(){
        $scope.init();
      });

    })

    .controller('NlpCtrl', function($scope, $ionicLoading, $ionicPlatform, $ionicPopup, $cordovaSms, Commons, Webservice) {
      $scope.clear = function() {
        $scope.selection = {
          input: '',
          result: null
        };
      };
      $scope.clear();
      $scope.parse = function(){
        $ionicLoading.show();
        Webservice.nlparse(
          {
            input: $scope.selection.input
          },
          function(res) {
            console.log(JSON.stringify(res));
            $ionicLoading.hide();
            $scope.selection.result = res;
          },
          function(err) {
            $ionicPopup.alert({title:'Data gagal diunggah', template:err}).then(function(res) {});
            $ionicLoading.hide();
          }
        );
      };
    })

    ;

    // add control to google map
    function addMapControl(map, onClick) {
      var buttonId = 'center-button';
      var title = 'My location';
      var centerButton = document.getElementById(buttonId);
      if (map && !centerButton) {
        var controlUI = document.createElement('button');
        controlUI.id = buttonId;
        controlUI.className = 'button button-calm icon ion-android-radio-button-on';
        controlUI.index = 1;
        controlUI.title = title;
        controlUI.style.marginTop = '15px';
        controlUI.addEventListener('click', onClick);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlUI);
      }
    }

    // handle undetected number
    function isUndetectedNumber(mobile, ionicPopup, state) {
      if (!mobile) {
        ionicPopup.alert({title:'Nomor tidak terdeteksi', template:'Nomor tidak terdeteksi. Silahkan lakukan registrasi lebih dulu.'})
        .then(function(res) {
          state.go('tab.account');
        });
        return true;
      } else {
        return false;
      }
    }
