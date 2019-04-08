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
  globalData: {
    baseUri: 'http://guolin.tech/api/china',      //省、市、县网址
    baseWeatherUri: "http://guolin.tech/api/weather", //天气网址
    key: "67625eeac43f4b0bb42e58110a9a9f0f",      //密钥
    that: null,
    provinceList: null,   //存储
    weatherList: null,        //存储
    callback: null
  }
})