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
var cityName = null
var provinceName = null
Page({
  data: {
    currentLevel: UNKNOW_LEVEL,
    dataList : null,
    hh: [
      {
      h:1,
      g:2
      },
      {
      h:2,
      g:3
      }]
  }, 
  //事件处理函数
  // bindViewTap: function() {
  //   wx.navigateTo({
  //     url: '../logs/logs'
  //   })
  // },
  onLoad: function (options) {
    console.log('1111')
    //天气页面跳转过来的请求标识
    var add = null;
    if(options.add != null) {
      add = options.add
    }
    //内存中有天气信息，跳转到天气页面
    if (!add && app.globalData.weatherList) {
      wx.redirectTo({
        url: '../weather/weather'
      })
    }
    if (app.globalData.provinceList) {
      provinceList = app.globalData.provinceList
      this.setData({
        currentLevel: PROVINCE_LEVEL,
        dataList: app.globalData.provinceList
      })
    } else {
      //异步请求回调
      this.setData({
        onLoadDate: true
      })
      wx.showLoading({
        title: '正在初始化...'
      })
      app.globalData.that = this
      app.globalData.callback = res=> {
        var tPage = app.globalData.that
        tPage.provinceList = res.data
        tPage.setData({
          dataList: res.data,
          currentLevel: PROVINCE_LEVEL
        })
      }
      setTimeout(function(){
        wx.hideLoading()
        if (getCurrentPages()[getCurrentPages().length-1].provinceList == null) {
          wx.showToast({
            title: '请检查网络设置',
            icon: 'none',
            duration: 2000
          })
        }
      },1000,null)
    }
  },
  doBindTap: function(e) {
    if (this.data.currentLevel == PROVINCE_LEVEL) {
      selectProvince = e.target.dataset.id
      provinceName = e.target.dataset.name
      wx.showLoading({
        title: '正在加载城市列表...'
      })
      wx.request({
        url: baseUri + '/' + selectProvince,
        success: res => {
          wx.hideLoading()
          cityList = res.data;
          wx.setNavigationBarTitle({
            title: '' + provinceName,
          })
          this.setData({
            currentLevel: CITY_LEVEL,
            dataList: cityList
          })
        },
        fail: res => {
          wx.hideLoading()
          wx.showToast({
            title: '获取列表失败，请检查网络',
            icon: 'none',
            duration: 2000
          })
        }
      })
    } else if (this.data.currentLevel == CITY_LEVEL) {
      selectCity = e.target.dataset.id
      cityName = e.target.dataset.name
      wx.showLoading({
        title: '正在加载城市列表...'
      })
      wx.request({
        url: baseUri + '/' + selectProvince + '/' + selectCity,
        success: res => {
          wx.hideLoading()
          wx.setNavigationBarTitle({
            title: '' + cityName,
          })
          this.setData({
            currentLevel: COUNTRY_LEVEL,
            dataList: res.data
          })
        },
        fail: res => {
          wx.hideLoading()
          wx.showToast({
            title: '获取列表失败，请检查网络',
            icon: 'none',
            duration: 2000
          })
        }
      })
    } else if (this.data.currentLevel == COUNTRY_LEVEL) {
      // selectCountry = e.target.dataset.id
      var weatherId = e.target.dataset.weatherid
      wx.showLoading({
        title: '正在加载城市天气...'
      })
      wx.request({
        url: baseWeatherUri + "?cityid=" + weatherId + "&key=" + key,
        success: res => {
          wx.hideLoading()
          //将获取到的天气
          var index = -1;
          //第一个天气
          if (!app.globalData.weatherList) {
            console.log('weatherList is null')
            app.globalData.weatherList = new Array()
          }
          for (var i = 0; i < app.globalData.weatherList.length; i++) {
            console.log(i)
            if (weatherId == app.globalData.weatherList[i].HeWeather[0].basic.cid) {
              console.log('find same city ,then instead of it')
              app.globalData.weatherList[i] = res.data
              index = i + 1;
              break;
            }
          }
          //返回本次获取的内存索引
          console.log(app.globalData.weatherList)
          if(index == -1) {
            index = app.globalData.weatherList.push(res.data)
          }
          wx.setStorage({
            key: 'weatherList',
            data: app.globalData.weatherList
          })
          console.log('index: ' + index)
          wx.reLaunch({
            url: '../weather/weather?index=' + index
          })
        },
        fail: res => {
          wx.hideLoading()
          wx.showToast({
            title: '获取天气失败，请检查网络',
            icon: 'none',
            duration: 2000
          })
         }   
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
      wx.setNavigationBarTitle({
        title: '',
      })  
      this.setData({
        currentLevel: PROVINCE_LEVEL,
        dataList: provinceList
      })
    } else if (this.data.currentLevel == COUNTRY_LEVEL) {
      wx.setNavigationBarTitle({
        title: '' + cityName,
      })
      this.setData({
        currentLevel: CITY_LEVEL,
        dataList: cityList
      })
    }
  }
})
