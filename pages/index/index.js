//index.js
//获取应用实例
const app = getApp()
const UNKNOW_LEVEL = 0
const PROVINCE_LEVEL = 1
const CITY_LEVEL = 2
const COUNTRY_LEVEL = 3
var baseUri = app.globalData.baseUri
var baseWeatherUri = app.globalData.baseWeatherUri
var key = app.globalData.key
var provinceList = null
var cityList = null
var selectProvince = -1
var selectCity = -1
// var selectCountry = -1
Page({
  data: {
    currentLevel: UNKNOW_LEVEL,
    haha: 0,
    dataList : null,
    firstLoad : false
  }, 
  //事件处理函数
  // bindViewTap: function() {
  //   wx.navigateTo({
  //     url: '../logs/logs'
  //   })
  // },
  onLoad: function () {
    if (app.globalData.provinceList) {
      console.log('onLoad yes')
      provinceList = app.globalData.provinceList
      this.setData({
        currentLevel: PROVINCE_LEVEL,
        dataList: app.globalData.provinceList
      })
    } else {
      //异步请求回调
      console.log('no')
      app.globalData.that = this
      app.globalData.callback = res=> {
        var tPage = app.globalData.that
        tPage.provinceList = res.data
        tPage.setData({
          haha: 2
          // dataList: res.data,
          // currentLevel: PROVINCE_LEVEL
        })
      }
    }
    //内存中有天气信息，跳转到天气页面
    if (app.globalData.weather) {
      console.log('true')
      wx.navigateTo({
        url: '../weather/weather'
      })
    }
  },
  doBindTap: function(e) {
    if (this.data.currentLevel == PROVINCE_LEVEL) {
      selectProvince = e.target.dataset.id;
      console.log('省级点击进入市级' + selectProvince)
      wx.request({
        url: baseUri + '/' + selectProvince,
        success: res => {
          cityList = res.data;
          this.setData({
            currentLevel: CITY_LEVEL,
            dataList: cityList
          })
        }
      })
    } else if (this.data.currentLevel == CITY_LEVEL) {
      selectCity = e.target.dataset.id;
      console.log('市级点击进入县级' + selectCity)
      wx.request({
        url: baseUri + '/' + selectProvince + '/' + selectCity,
        success: res => {
          this.setData({
            currentLevel: COUNTRY_LEVEL,
            dataList: res.data
          })
        }
      })
    } else if (this.data.currentLevel == COUNTRY_LEVEL) {
      // selectCountry = e.target.dataset.id
      var weatherId = e.target.dataset.weatherid
      console.log('县级获取天气' + weatherId)
      //保存县对应的weatherId，用于更新使用
      app.globalData.weatherId = weatherId
      wx.setStorageSync('weatherId', weatherId)
      wx.request({
        url: baseWeatherUri + "cityid=" + weatherId + "&key=" + key,
        success: res => {
          //将获取到的天气
          console.log('获取天气成功' + weatherId)
          app.globalData.weather = res.data
          wx.setStorageSync('weather', app.globalData.weather)
          wx.navigateTo({
            url: '../weather/weather'
          })
        },   
      })
    }
  },
  returnTap: function(e) {
    if (this.data.currentLevel == PROVINCE_LEVEL) {
      wx.showToast({
        title: '无法返回，已经是最顶层',
        icon: 'none',
        duration: 2000
      })
    } else if (this.data.currentLevel == CITY_LEVEL) {
      console.log('市级退回省级')      
      this.setData({
        currentLevel: PROVINCE_LEVEL,
        dataList: provinceList
      })
    } else if (this.data.currentLevel == COUNTRY_LEVEL) {
      console.log('县级退回市级')  
      this.setData({
        currentLevel: CITY_LEVEL,
        dataList: cityList
      })
    }
  },
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading()
    provinceList = app.globalData.provinceList
    this.setData({
      dataList: app.globalData.provinceList
    })
    console.log('' + this.data.dataList)
    wx.hideNavigationBarLoading() //完成停止加载
    wx.stopPullDownRefresh() //停止下拉刷新
  }
})
