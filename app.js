//app.js
App({
  onLaunch: function () {
    var provinces
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    
    var notFirstLoad = wx.getStorageSync('notFirstLoad')
    console.log('firstLoad value is :' + notFirstLoad)

    if (!notFirstLoad) {
      wx.request({
        url: 'http://guolin.tech/api/china',
        success: res=> {
          provinces = res.data;
          this.globalData.provinceList = provinces;
          console.log('data length:' + this.globalData.provinceList.length)
          if (this.globalData.callback != null) {
            console.log('callback is know')
            this.globalData.callback(res)
          }
          // wx.setStorageSync('provinces', provinces);
          // wx.setStorageSync('notFirstLoad', !notFirstLoad);
        }
      })
    } else {
      this.globalData.provinceList = wx.getStorageSync('provinces');
      this.globalData.weather = wx.getStorageSync('weather');
      this.globalData.weatherId = wx.getStorageSync('weatherId');
    }
  },
  globalData: {
    baseUri: 'http://guolin.tech/api/china',      //省、市、县网址
    baseWeatherUri: "http://guolin.tech/api/weather", //天气网址
    key: "67625eeac43f4b0bb42e58110a9a9f0f",      //密钥
    that: null,
    provinceList: null,   //存储
    weather: null,        //存储
    weatherId: null,      //存储
    callback: null
  }
})