//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    
    var notFirstLoad = wx.getStorageSync('notFirstLoad')
    console.log('firstLoad value is :' + notFirstLoad)

    if (!notFirstLoad) {
      wx.request({
        url: this.globalData.baseUri,
        success: res=> {
          this.globalData.provinceList = res.data;
          if (this.globalData.callback != null) {
            console.log('callback is know')
            this.globalData.callback(res)
          }
          wx.setStorage({
            key: 'provinces',
            data: res.data
          });
          wx.setStorage({
            key:  'notFirstLoad',
            data: true
          });
        }
      })
    } else {
      this.globalData.provinceList = wx.getStorageSync('provinces');
      this.globalData.weatherList = wx.getStorageSync('weatherList');
    }
  },
  parserLocation: function(data,callback) {
    var res
    var address = data.address_component
    var provinceId,cityId,weatherId
    var province,city,country
    province = address.province.substring(0, address.province.length - 1)
    city = address.city.substring(0, address.city.length - 1)
    //区/县为空，则将城市名赋值给区/县
    country = address.district? address.district.substring(0, address.district.length - 1) : city
    for (var i = 0; i < this.globalData.provinceList.length; i++) {
      if (this.globalData.provinceList[i].name == province) {
        provinceId = this.globalData.provinceList[i].id
        break;
      }
    }
    if (provinceId) {
      wx.request({
        url: this.globalData.baseUri + '/' + provinceId,
        success: res => {
          for (var i = 0; i < res.data.length; i++) {
            if (res.data[i].name == city) {
              cityId = res.data[i].id
              break;
            }
          }
          if (cityId) {
            wx.request({
              url: this.globalData.baseUri + '/' + provinceId + '/' + cityId,
              success: res => {
                console.log('获取成功')
                weatherId = res.data[0].weather_id
                for (var i = 0; i < res.data.length; i++) {
                  if (res.data[i].name == country) {
                    weatherId = res.data[i].weather_id
                    break;
                  }
                }
                res = {         //构造响应体
                  result: 'success',
                  data: {
                    weatherId,
                    province,
                    city,
                    country
                  }
                }
                if (callback) {
                  callback(res);
                }
              },
              fail: res => {
                res = {
                  result: 'error'
                }
                if (callback) {
                  callback(res);
                }
              }
            })
          } else {
            res = {
              result: 'not support location'
            }
            if (callback) {
              callback(res);
            }
          }
        },
        fail: res => {
          res = {
            result: 'error'
          }
          if (callback) {
            callback(res);
          }
        }
      })
    } else {
      res = {
        result: 'not support location'
      }
      if (callback) {
        callback(res);
      }
    }
  },
  globalData: {
    locationBDKey: 'RUSBZ-OZNKD-T7J45-H4YVH-EDBE6-XGFLF',
    locationBDUri: 'https://apis.map.qq.com/ws/geocoder/v1/',
    baseUri: 'http://guolin.tech/api/china',      //省、市、县网址
    baseWeatherUri: "http://guolin.tech/api/weather", //天气网址
    key: "67625eeac43f4b0bb42e58110a9a9f0f",      //密钥
    provinceList: null,   //存储
    weatherList: null,        //存储
    callback: null,
    backgroundImgUrl: {
      sun: 'https://cn.bing.com/th?id=OHR.AurovilleIndia_ZH-CN4983141175_1920x1080.jpg&rf=NorthMale_1920x1081920x1080.jpg',
      rain: 'http://www.ouyaoxiazai.com/soft/UploadPic/2016-3/201638163450340.jpg',
      cloud: 'http://dpic.tiankong.com/7u/vd/QJ6679651500.jpg',
      snow: 'http://img2.ph.126.net/G8QwvQTaFf3c-iGSrg0dCA==/3866058805221119408.jpg'
    }
  }
})