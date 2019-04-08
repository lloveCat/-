const app = getApp()
var baseWeatherUri = app.globalData.baseWeatherUri
var key = app.globalData.key
//用于下拉更新时使用 
var weatherId = null
var cities = null;
Page({
  data: {
    backgroundImgUrl: null,
    loadSuccess: true,
    moreHidden: true,
    cityList: null,
    // basic: null,
    // updateTime: null,
    // status: null,
    // now: null,
    // daily_forecast: null,
    // aqi: null,
    // suggestion: null
    weatherList: null,
    indexItem: 0
  },
  utilSetData: function(index) {
    var condToday = app.globalData.weatherList[index].HeWeather[0].now.cond_txt
    var backgroundImgUrlTmp = null;
    if(condToday == '晴') {
      backgroundImgUrlTmp = app.globalData.backgroundImgUrl.sun
    } else if(condToday.indexOf('雨') != -1) {
      backgroundImgUrlTmp = app.globalData.backgroundImgUrl.rain
    } else if(condToday == '多云' || condToday == '阴') {
      backgroundImgUrlTmp = app.globalData.backgroundImgUrl.cloud
    } else if(condToday.indexOf('雪') != -1) {
      backgroundImgUrlTmp = app.globalData.backgroundImgUrl.snow
    } else {
      backgroundImgUrlTmp = 'https://cn.bing.com/th?id=OHR.AurovilleIndia_ZH-CN4983141175_1920x1080.jpg&rf=NorthMale_1920x1081920x1080.jpg'
    }
      this.setData({
      backgroundImgUrl: backgroundImgUrlTmp,
      loadSuccess: true,
      cityList: cities,
      weatherList: app.globalData.weatherList,
      indexItem: index
    })
    wx.setNavigationBarTitle({
      title: '' + cities[index],
    })
    weatherId = weatherId = app.globalData.weatherList[index].HeWeather[0].basic.cid
    console.log('当前显示城市：' + this.data.cityList[index] + ' 索引：' + index + '城市id：' + weatherId + '城市天气为：' + condToday)
    console.log('backgroundUrl: ' + this.data.backgroundImgUrl)
  },
  // utilSetData: function(weather) {
  //   console.log('utilSetData:weather' + weather.HeWeather)
  //   var HeWeather = weather.HeWeather
  //   //部分地区天气获取不到，HeWeather是[]空数组 
  //   if (HeWeather != null && HeWeather[0] != null) {
  //     var tempBasic = HeWeather[0].basic //basic内容 
  //     var tempUpdateTime = HeWeather[0].update.loc.substring(11, 16)
  //     // (HeWeather[0].update.loc.split('\\s+'))[1] //更新时间'' 
  //     var tempStatus = HeWeather[0].status //状态 
  //     var tempNow = HeWeather[0].now //当前天气 
  //     var tempDaily_forecast = HeWeather[0].daily_forecast //未来三天天气 
  //     var tempAqi = HeWeather[0].aqi //空气质量 
  //     var tempSuggestion = HeWeather[0].suggestion //建议 
  //     wx.setNavigationBarTitle({
  //       title: '' + cities[currentIndex],
  //     })
  //     this.setData({
  //       loadSuccess: true,
  //       cityList: cities,
  //       basic: tempBasic,
  //       updateTime: tempUpdateTime,
  //       status: tempStatus,
  //       now: tempNow,
  //       daily_forecast: tempDaily_forecast,
  //       aqi: tempAqi,
  //       suggestion: tempSuggestion
  //     })
  //     weatherId = this.data.basic.cid
  //   }
  // },
  onLoad: function(options) {
    var currentIndex = 0
    if (options.index != null) { //区域选择传过来的index索引 
      currentIndex = options.index - 1;
    }
    if (app.globalData.weatherList) {
      cities = new Array()
      for (var i = 0; i < app.globalData.weatherList.length; i++) {
        cities.push(app.globalData.weatherList[i].HeWeather[0].basic.location) //已读取天气的地区名 
      }
      this.utilSetData(currentIndex)
    } else {
      this.setData({
        loadSuccess: false
      })
    }
  },
  onPullDownRefresh: function() {
    if (!weatherId) {
      wx.showToast({
        title: '请先选择区域！',
        icon: 'none',
        duration: 2000
      })
    } else {
      wx.showNavigationBarLoading()
      wx.request({
        url: baseWeatherUri + "?cityid=" + weatherId + "&key=" + key,
        success: res => {
          //将获取到的天气 
          console.log('获取天气成功' + weatherId)
          app.globalData.weatherList[this.data.indexItem] = res.data
          wx.setStorageSync('weatherList', app.globalData.weatherList)
          this.utilSetData(this.data.indexItem)
          wx.hideNavigationBarLoading() //完成停止加载 
          wx.stopPullDownRefresh() //停止下拉刷新 
        },
        fail: res => {
          wx.showToast({
            title: '刷新失败，请检测网络状况',
            icon: 'none',
            duration: 2000
          })
          wx.hideNavigationBarLoading() //完成停止加载 
          wx.stopPullDownRefresh() //停止下拉刷新 
        }
      })
    }
  },
  //点击更多触发,拦截事件不被父view接收到 
  moreTap: function(e) {
    this.setData({
      moreHidden: false
    })
  },
  //隐藏框显示时点击不触发隐藏，拦截事件不被父view接收到 
  catchHidden: function(e) {
    console.log('当前隐藏框显示，点击隐藏框区域，不隐藏')
  },
  //点击当前页面除上诉两区域外隐藏框隐藏 
  hiddenMore: function(e) {
    this.setData({
      moreHidden: true
    })
  },
  //-按钮触发事件 
  deleteCountryTap: function(e) {
    var index = e.target.dataset.index;
    wx.showModal({
      title: '删除城市',
      content: '确认删除已存在的' + this.data.cityList[index] + '天气记录吗',
      success: res => {
        if (res.confirm) { //点击确认按钮 
          if (this.data.cityList.length == 1) { //当前只有一个城市的天气，不允许删除 
            wx.showToast({
              title: '当前仅剩一个城市',
              icon: 'none',
              duration: 2000
            })
            return;
          }
          var currentIndex = this.data.indexItem
          app.globalData.weatherList.splice(index, 1) //删除选中的城市记录 
          cities.splice(index, 1) //城市名列表移除该城市 
          if (index == currentIndex) { //逻辑：删除当前的，则跳到列表第一个weatherList[0] 
            currentIndex = 0 //设置当前索引为0，即第一个城市天气 
          } else if (index < currentIndex) { //逻辑：删除非当前城市，如果索引小于当前城市，更新当前城市索引
            currentIndex = currentIndex - 1
          }
          this.utilSetData(currentIndex)
          wx.setStorage({
            key: 'weatherList',
            data: app.globalData.weatherList
          })
        }
      }
    })
  },
  //点击更多中的城市触发事件 
  chooseCountryTap: function(e) {
    var index = e.target.dataset.index;
    if (index != this.data.indexItem) {
      this.utilSetData(index)
    }
  },
  //点击更多中的添加城市触发事件 
  addCountryTap: function(e) {
    console.log('add country Tap')
    wx.navigateTo({
      url: '../index/index?add=1'
    })
  },
  swiperChangeFunc: function(e) {
    this.utilSetData(e.detail.current)
  }
})