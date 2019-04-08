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
    callback: null,
    backgroundImgUrl: {
      sun: 'https://cn.bing.com/th?id=OHR.AurovilleIndia_ZH-CN4983141175_1920x1080.jpg&rf=NorthMale_1920x1081920x1080.jpg',
      rain: 'http://www.ouyaoxiazai.com/soft/UploadPic/2016-3/201638163450340.jpg',
      cloud: 'http://dpic.tiankong.com/7u/vd/QJ6679651500.jpg',
      snow: 'http://img2.ph.126.net/G8QwvQTaFf3c-iGSrg0dCA==/3866058805221119408.jpg'
    }
  }
})