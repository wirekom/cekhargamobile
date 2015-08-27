angular.module('starter.controllers', ['ngCordova'])



.controller('AccountCtrl', function($scope, $ionicModal, $ionicLoading, Commons) {
  $scope.registration = {};
  $scope.config = {
    SMSServer: Commons.SMSServer(),
    APIServer: Commons.APIServer()
  };

  $scope.init = function() {
    $scope.registration = Commons.userInfo();
  }

  $scope.$on('$ionicView.beforeLeave', function() {
    if ($scope.config.SMSServer != Commons.SMSServer() || $scope.config.APIServer != Commons.APIServer()) {
      if (confirm('Simpan konfigurasi?')) {
        Commons.updateSMSServer($scope.config.SMSserver);
        Commons.updateAPIServer($scope.config.APIServer);
      }
    }
  });

  $ionicModal.fromTemplateUrl('register-modal.html', {
   scope: $scope,
   animation: 'slide-in-up'
  }).then(function(modal) {
   $scope.modal = modal
  })

  $ionicModal.fromTemplateUrl('register-view-modal.html', {
   scope: $scope,
   animation: 'slide-in-up'
  }).then(function(modal) {
   $scope.viewModal = modal
  })

 $scope.openModal = function() {
   $scope.modal.show()
 }

 $scope.closeModal = function() {
   $scope.modal.hide();
 };

 $scope.register = function() {
   Commons.updateUserInfo($scope.registration);
   $scope.modal.hide();
 };

 $scope.openViewModal = function() {
   $scope.viewModal.show();
 };

 $scope.closeViewModal = function() {
   $scope.viewModal.hide();
 };

 $scope.$on('$destroy', function() {
   $scope.modal.remove();
 });

})

.controller('CekHargaCtrl', function($scope, $ionicLoading, $cordovaSms, $ionicPlatform, Commons, Webservice) {

  // set options
  Commons.items().success(function(data) {
    $scope.items = data;
    $scope.selection = {
      item: ($scope.items.length > 0) ? $scope.items[0].id : null,
      radius: 0
    };
  }).error(function() {
    $scope.items = Commons.offlineItems();
    $scope.selection = {
      item: ($scope.items.length > 0) ? $scope.items[0].id : null,
      radius: 0
    };
  });
  $scope.currentPosition = null;
  $scope.map = null;
  $scope.markers = [];

  $scope.onPositionFound = function(position) {
    var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    $scope.currentPosition = myLatlng;
    var marker = new google.maps.Marker({
      position: myLatlng,
      map: $scope.map,
      title: 'Posisi Anda (' + position.coords.latitude + ', ' +  position.coords.longitude + ')'
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
    alert('Lokasi tidak berhasil dideteksi : ' + err.message + ' (' + err.code + ')');
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
        {maximumAge: 30000, timeout: 20000, enableHighAccuracy: false}
      );
    }

    // in case position was not found, try it again on view re-enter
    $scope.$on('$ionicView.enter', function() {
      $scope.init();
    });

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

          var content = {name: name, radius: $scope.selection.radius, geolocation: $scope.currentPosition.lat() + ',' + $scope.currentPosition.lng(), nohp: Commons.userInfo().mobile};
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
              alert(err);
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
                alert('SMS berhasil dikirim')
                $ionicLoading.hide();
              }, function(error) {
                alert('SMS gagal dikirim: ' + error);
                $ionicLoading.hide();
              });
            });
          } catch(err) {
            alert(err);
            $ionicLoading.hide();
          }
        }
      }
    }

    $scope.addMarkers = function(locations) {
      $scope.clearMarkers();
      for (var i=0;i<locations.length;i++) {
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(locations[i].latitude, locations[i].longitude),
          map: $scope.map,
          icon: {url:'http://maps.google.com/mapfiles/kml/paddle/grn-circle.png', scaledSize:new google.maps.Size(40, 40)},
		  animation: google.maps.Animation.DROP,
          title: locations[i].barang + ' Rp ' + locations[i].price
        });
        var infowindow = new google.maps.InfoWindow({
          content: marker.title
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

  })

  .controller('PosHargaCtrl', function($scope, $ionicLoading, $ionicPlatform, $cordovaSms, Commons, Webservice) {
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
    $scope.markers = [];
    $scope.currentMarker = null;
    $scope.map = null;

    $scope.sendPrice = function(source) {
      $scope.source = source;
      if ('WEB' == $scope.source) {
        var content = {id: $scope.selection.item, harga: $scope.selection.price, quantity:0, geolocation: $scope.currentPosition.lat() + ',' + $scope.currentPosition.lng(), nohp: Commons.userInfo().mobile};
        console.log(JSON.stringify(content));
        $ionicLoading.show();
        Webservice.input(
          content,
          function(res) {
            console.log(JSON.stringify(res));
            alert('Data berhasil dikirim');
            $ionicLoading.hide();
          },
          function(err) {
            alert(err);
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
              alert('SMS berhasil dikirim')
              $ionicLoading.hide();
            }, function(error) {
              alert('SMS gagal dikirim: ' + error);
              $ionicLoading.hide();
            });
          });
        } catch(err) {
          alert(err);
          $ionicLoading.hide();
        }
      }
    }


      $scope.onPositionError = function(err) {
        alert('Lokasi tidak berhasil dideteksi : ' + err.message + ' (' + err.code + ')');
        $ionicLoading.hide();
      }

      $scope.onPositionFound = function(position) {
        var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        $scope.currentPosition = myLatlng;
        var marker = new google.maps.Marker({
          position: myLatlng,
          map: $scope.map,
          title: 'Posisi Anda (' + position.coords.latitude + ', ' +  position.coords.longitude + ')'
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
            {maximumAge: 30000, timeout: 20000, enableHighAccuracy: false}
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

        $scope.clearMarkers = function() {
      		for ( var i = 0; i < $scope.markers.length; i++) {
      			$scope.markers[i].setMap(null);
      		}
          $scope.markers = [];
      	}

        // in case position was not found, try it again on view re-enter
        $scope.$on('$ionicView.enter', function() {
          $scope.init();
        });

        $scope.$on('$ionicView.leave', function() {
          $scope.map = null;
        });

    })

    .controller('JualCtrl', function($scope, $ionicLoading, $ionicPlatform, $cordovaSms, Commons, Webservice) {
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
            var content = {id: $scope.selection.item, quantity: $scope.selection.qty, harga: $scope.selection.price, geolocation: $scope.currentPosition.lat() + ',' + $scope.currentPosition.lng(), nohp: Commons.userInfo().mobile};
            console.log(JSON.stringify(content));
            $ionicLoading.show();
            Webservice.input(
              content,
              function(res) {
                console.log(JSON.stringify(res));
                alert('Data berhasil dikirim');
                $ionicLoading.hide();
              },
              function(err) {
                alert(err);
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
                  alert('SMS berhasil dikirim')
                  $ionicLoading.hide();
                }, function(error) {
                  alert('SMS gagal dikirim: ' + error);
                  $ionicLoading.hide();
                });
              });
            } catch(err) {
              alert(err);
              $ionicLoading.hide();
            }
          }

          // var options = {maximumAge: 30000, timeout: 20000, enableHighAccuracy: false};
          // navigator.geolocation.getCurrentPosition(
          //   $scope.onPositionFound,
          //   function(err) {
          //     options.enableHighAccuracy = true; // force native GPS
          //     navigator.geolocation.getCurrentPosition(
          //       $scope.onPositionFound,
          //       $scope.onPositionError,
          //       options
          //     );
          //   },
          //   options);
          }

        // $scope.onPositionFound = function(pos) {
        //   if ('WEB' == $scope.source) {
        //     Webservice.example(
        //       {barang: $scope.selection.item, penjual: $scope.selection.seller, harga: $scope.selection.price, lat: pos.coords.latitude, lng: pos.coords.longitude},
        //       function(res) {
        //         alert(JSON.stringify(res));
        //         $ionicLoading.hide();
        //       },
        //       function(err) {
        //         alert(err);
        //         $ionicLoading.hide();
        //       }
        //     );
        //   } else if ('SMS' == $scope.source) {
        //     var phonenumber = Commons.SMSServer();
        //     var content = 'POSHARGA ' + $scope.selection.item.toUpperCase() + ' ' + $scope.selection.seller.toUpperCase() + ' ' + $scope.selection.price + ' ' + pos.coords.latitude + ' ' + pos.coords.longitude;
        //     alert(content);
        //     $ionicLoading.show();
        //     try {
        //       $ionicPlatform.ready(function() {
        //         $cordovaSms
        //         .send(phonenumber, content)
        //         .then(function() {
        //           alert('SMS berhasil dikirim')
        //           $ionicLoading.hide();
        //         }, function(error) {
        //           alert('SMS gagal dikirim: ' + error);
        //           $ionicLoading.hide();
        //         });
        //       });
        //     } catch(err) {
        //       alert(err);
        //       $ionicLoading.hide();
        //     }
        //   }
        // }

        $scope.onPositionError = function(err) {
          alert('Lokasi tidak berhasil dideteksi : ' + err.message + ' (' + err.code + ')');
          $ionicLoading.hide();
        }

        $scope.onPositionFound = function(position) {
          var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          $scope.currentPosition = myLatlng;
          var marker = new google.maps.Marker({
            position: myLatlng,
            map: $scope.map,
            title: 'Posisi Anda (' + position.coords.latitude + ', ' +  position.coords.longitude + ')'
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
              {maximumAge: 30000, timeout: 20000, enableHighAccuracy: false}
            );
            $scope.loggedIn = Commons.userInfo().username != null; // TODO call API
          }

          // in case position was not found, try it again on view re-enter
          $scope.$on('$ionicView.enter', function() {
            $scope.init();
          });

          $scope.$on('$ionicView.leave', function() {
            $scope.map = null;
          });

      })

    ;
