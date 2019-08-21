//app.js
App({
  onLaunch: function() {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    wx.onNetworkStatusChange(res => { //注册网络监听器
      if (!res.isConnected && this.globalData.sessionId) {
        this.showErrorToast('从服务器断开')
        this.globalData.sessionId = null;
      } else if (res.isConnected && this.globalData.userInfo) {
        this.showErrorToast('正在连接服务器...')
        this.loginToServer(res=>{});
      }
    })

    wx.getSetting({ //尝试获取用户信息
      success: res => {
        if (res.authSetting["scope.userInfo"]) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              this.loginToServer()
            }
          })
        }
      },
      fail: res => {
        console.log('获取配置失败')
      }
    })

    var notFirstLoad = wx.getStorageSync('notFirstLoad') //第一次进入APP标识
    console.log('firstLoad value is :' + notFirstLoad)

    if (!notFirstLoad) {
      wx.request({ //获取省份信息并保存入内存storage中
        url: this.globalData.baseUri,
        success: res => {
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
            key: 'notFirstLoad',
            data: true
          });
        }
      })
    } else { //直接从内存中读取省份列表和已选天气（可能为空）
      this.globalData.provinceList = wx.getStorageSync('provinces');
      this.globalData.weatherList = wx.getStorageSync('weatherList');
    }
  },
  //登录至服务器
  loginToServer: function(loginCallback) { //点击登录按钮时才会携带回调
    var userInfo = this.globalData.userInfo
    wx.login({
      success: res => {
        console.log('凭证：' + res.code)
        wx.request({
          url: 'http://localhost/user/onLogin',
          method: 'GET',
          data: {
            code: res.code, //临时登录凭证
            nikeName: userInfo.nickName, //用户信息
            gender: userInfo.gender,
            city: userInfo.city,
            province: userInfo.province,
            country: userInfo.country,
            language: userInfo.language,
          },
          success: res => {
            if (res.data.status === 0) { //登录成功
              this.showSuccessToast('登录成功')
              if (loginCallback) {
                console.log('callback is know')
                loginCallback()
              }
              this.globalData.sessionId = res.data.data
            } else {
              this.showErrorToast('登录失败')
            }
          },
          fail: res => {
            if (loginCallback) {
              this.showErrorToast('登录失败')
            }
          }
        })
      },
      fail: res => {
        console.log('调用wx.login API失败')
      }
    })
  },

  //地址反解析
  parserLocation: function(data, callback) {
    var resultInfo
    var address = data.address_component
    var provinceId, cityId, weatherId
    var province, city, country
    province = address.province.substring(0, address.province.length - 1)
    city = address.city.substring(0, address.city.length - 1)
    //区/县为空，则将城市名赋值给区/县
    country = address.district ? address.district.substring(0, address.district.length - 1) : city
    for (var i = 0; i < this.globalData.provinceList.length; i++) {
      if (this.globalData.provinceList[i].name == province) {
        provinceId = this.globalData.provinceList[i].id
        break;
      }
    }
    //匹配到省，请求市级信息
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
          //匹配到市，请求县/区信息
          if (cityId) {
            wx.request({
              url: this.globalData.baseUri + '/' + provinceId + '/' + cityId,
              success: res => {
                weatherId = res.data[0].weather_id
                for (var i = 0; i < res.data.length; i++) {
                  if (res.data[i].name == country) {
                    weatherId = res.data[i].weather_id
                    break;
                  }
                }
                res = { //构造响应体
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
              //请求县级失败
              fail: res => {
                resultInfo = {
                  result: 'error'
                }
                if (callback) {
                  callback(resultInfo);
                }
              }
            })
          } else {
            //没有匹配到市
            resultInfo = {
              result: 'not support location'
            }
            if (callback) {
              callback(resultInfo);
            }
          }
        },
        //查询市失败
        fail: res => {
          resultInfo = {
            result: 'error'
          }
          if (callback) {
            callback(resultInfo);
          }
        }
      })
      //未匹配到省
    } else {
      resultInfo = {
        result: 'not support location'
      }
      if (callback) {
        callback(resultInfo);
      }
    }
  },
  showErrorToast: function(txt) {
    wx.showToast({
      title: '' + txt,
      icon: 'none',
      duration: 2000
    })
  },
  showSuccessToast: function(txt) {
    wx.showToast({
      title: '' + txt,
      icon: 'success',
      duration: 1500
    })
  },
  globalData: {
    locationBDKey: 'RUSBZ-OZNKD-T7J45-H4YVH-EDBE6-XGFLF', //腾讯地址反解析密钥
    locationBDUri: 'https://apis.map.qq.com/ws/geocoder/v1/',
    baseUri: 'http://guolin.tech/api/china', //省、市、县网址
    baseWeatherUri: "http://guolin.tech/api/weather", //天气网址
    key: "67625eeac43f4b0bb42e58110a9a9f0f", //获取天气密钥
    backgroundImgUrl: { //背景图片地址
      sun: 'https://cn.bing.com/th?id=OHR.AurovilleIndia_ZH-CN4983141175_1920x1080.jpg&rf=NorthMale_1920x1081920x1080.jpg',
      rain: 'http://www.ouyaoxiazai.com/soft/UploadPic/2016-3/201638163450340.jpg',
      cloud: 'http://dpic.tiankong.com/7u/vd/QJ6679651500.jpg',
      snow: 'http://img2.ph.126.net/G8QwvQTaFf3c-iGSrg0dCA==/3866058805221119408.jpg'
    },
    provinceList: null, //存储
    weatherList: null, //存储
    callback: null,
    sessionId: null,
    userInfo: null,
  }
})