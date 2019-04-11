const app = getApp()
var locationBDUri = app.globalData.locationBDUri
var locationBDKey = app.globalData.locationBDKey
var baseWeatherUri = app.globalData.baseWeatherUri
var key = app.globalData.key
//用于下拉更新时使用 
var weatherId = null
var cities = null;
var that = null;
Page({
  data: {
    loadSuccess: true,
    cityList: null,
    updateTime: null,
    moreHidden: true,
    backgroundImgUrl: null,
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
    var updateTimeTemp = app.globalData.weatherList[index].HeWeather[0].update.loc.substring(11,16)
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
      that.setData({
      backgroundImgUrl: backgroundImgUrlTmp,
      loadSuccess: true,
      cityList: cities,
      updateTime: updateTimeTemp,
      weatherList: app.globalData.weatherList,
      indexItem: index
    })
    wx.setNavigationBarTitle({
      title: '' + cities[index],
    })
    weatherId = weatherId = app.globalData.weatherList[index].HeWeather[0].basic.cid
    console.log('当前显示城市：' + that.data.cityList[index] + ' 索引：' + index + '城市id：' + weatherId + '城市天气为：' + condToday)
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
  //     that.setData({
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
  //     weatherId = that.data.basic.cid
  //   }
  // },
  onLoad: function(options) {
    that = this;
    var currentIndex = 0
    if (options.index != null) { //区域选择传过来的index索引 
      currentIndex = options.index - 1;
    }
    if (app.globalData.weatherList) {
      cities = new Array()
      for (var i = 0; i < app.globalData.weatherList.length; i++) {
        var location = app.globalData.weatherList[i].HeWeather[0].basic.location
        location = location.length > 3 ? location.substring(0,3) + '...' : location 
        cities.push(location) //已读取天气的地区名 
      }
      that.utilSetData(currentIndex)
    } else {
      that.setData({
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
          app.globalData.weatherList[that.data.indexItem] = res.data
          wx.setStorageSync('weatherList', app.globalData.weatherList)
          that.utilSetData(that.data.indexItem)
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
    that.setData({
      moreHidden: false
    })
  },
  //隐藏框显示时点击不触发隐藏，拦截事件不被父view接收到 
  catchHidden: function(e) {
    console.log('当前隐藏框显示，点击隐藏框区域，不隐藏')
  },
  //点击当前页面除上诉两区域外隐藏框隐藏 
  hiddenMore: function(e) {
    that.setData({
      moreHidden: true
    })
  },
  //-按钮触发事件 
  deleteCountryTap: function(e) {
    var index = e.target.dataset.index;
    wx.showModal({
      title: '删除城市',
      content: "确认删除已存在的 '" + that.data.weatherList[index].HeWeather[0].basic.location + 
              "' 天气记录吗",
      success: res => {
        if (res.confirm) { //点击确认按钮 
          if (that.data.cityList.length == 1) { //当前只有一个城市的天气，不允许删除 
            wx.showToast({
              title: '当前仅剩一个城市',
              icon: 'none',
              duration: 2000
            })
            return;
          }
          var currentIndex = that.data.indexItem
          app.globalData.weatherList.splice(index, 1) //删除选中的城市记录 
          cities.splice(index, 1) //城市名列表移除该城市 
          if (index == currentIndex) { //逻辑：删除当前的，则跳到列表第一个weatherList[0] 
            currentIndex = 0 //设置当前索引为0，即第一个城市天气 
          } else if (index < currentIndex) { //逻辑：删除非当前城市，如果索引小于当前城市，更新当前城市索引
            currentIndex = currentIndex - 1
          }
          that.utilSetData(currentIndex)
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
    if (index != that.data.indexItem) {
      that.utilSetData(index)
    }
  },
  //点击更多中的添加城市触发事件 
  addCountryTap: function(e) {
    console.log('add country Tap')
    wx.navigateTo({
      url: '../index/index?add=1'
    })
  },
  //滑动事件
  swiperChangeFunc: function(e) {
    that.utilSetData(e.detail.current)
  },
  //定位图标点击事件
  getLocationCountry: function(e) {
    console.log('点击获取当前所在城市')
    //尝试调用getLocation接口
    wx.getLocation({
      success: function(res) {
        wx.showLoading({
          title: '正在尝试获取城市天气...',
        })
        var location = res.latitude + ',' + res.longitude
        console.log('纬经度：' + location)
        wx.request({
          url: '' + locationBDUri,
          data: {
            key: locationBDKey,
            location: res.latitude + ',' + res.longitude
          },
          success: res => {
            app.parserLocation(res.data.result, that.parserLocationCallback)
          },
          fail: res => {
            console.log('调用百度接口失败!!!')
          }
        })
      },  
      //调用失败，询问用户是否跳转自授权页面
      fail: function(res) {
        wx.showModal({
          title: '授权',
          content: '是否跳转自授权页面修改授权信息',
          success: res=>{
            //用户同意跳转
            if (res.confirm) {
              wx.openSetting({ 
                //用于从授权页面返回
                success: function(res) {
                  //判断用户已授权地理信息
                  if (res.authSetting['scope.userLocation']) {
                    wx.showToast({
                      title: '授权成功，重新点击已获得当前位置信息',
                      duration: 1000,
                      icon: 'none'
                    })
                  }
                }
              })
            } else if(res.cancel) {
              wx.showToast({
                title: '授权失败，获取当前位置信息失败',
                duration: 1000,
                icon: 'none'
              })
            }
          }
        })
      }
    })
  },
  parserLocationCallback: function(result) {
    wx.hideLoading()
    console.log('result: ' + result.result + 'province: ' + result.data.province + 'city: ' + result.data.city + 'country: ' + result.data.country + 'weatherId: ' + result.data.weatherId)
    if (result.result === 'success') {
      wx.request({
        url: baseWeatherUri + "?cityid=" + result.data.weatherId + "&key=" + key,
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
            if (result.data.weatherId == app.globalData.weatherList[i].HeWeather[0].basic.cid) {
              console.log('find same city ,then instead of it')
              app.globalData.weatherList[i] = res.data
              index = i + 1;
              break;
            }
          }
          //返回本次获取的内存索引
          if (index == -1) {
            index = app.globalData.weatherList.push(res.data)
            cities.push(app.globalData.weatherList[index-1].HeWeather[0].basic.location)
          }
          console.log(index)
          wx.setStorage({
            key: 'weatherList',
            data: app.globalData.weatherList
          })
          that.utilSetData(index-1)
        }
      })
    } else {
      wx.showToast({
        title: '网络或其他错误！',
        duration: 2000,
        icon: 'none'
      })
    }
  }
})