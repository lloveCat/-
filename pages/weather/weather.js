// pages/weather/weather.js

const app = getApp()
var baseWeatherUri = app.globalData.baseWeatherUri
var key = app.globalData.key
var weatherId = null

Page({
  data: {
    weather: null
  },
  onLoad: function (options) {
    if (app.globalData.weather) {
      weatherId = app.globalData.weatherId
      console.log('weatherId:' + weatherId)
      this.setData({
        weather: app.globalData.weather
      })
    }
  },
  onPullDownRefresh: function () {
    if (!weatherId) {
      wx.showToast({
        title: '请先选择区域！',
        icon: 'none',
        duration: 2000
      })
    }else {
      wx.showNavigationBarLoading()
      wx.request({
        url: baseWeatherUri + "cityid=" + weatherId + "&key=" + key,
        success: res => {
          //将获取到的天气
          console.log('获取天气成功' + weatherId)
          app.globalData.weather = res.data
          wx.setStorageSync('weather', app.globalData.weather)
          this.setData({
            weather: res.data
          })
          wx.hideNavigationBarLoading() //完成停止加载
          wx.stopPullDownRefresh() //停止下拉刷新
        },
      })
    }
  },
  chooseTap: function() {
    wx.navigateTo({
      url: '../index/index'
    })
  }
})