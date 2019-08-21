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
var that = null;
var timer = 0; //超时
var timer1 = 0; //定时
var doTap = false; //防用户快速点击，处理点击事件标识
Page({
  data: {
    isLogin: false,
    userInfo: null,
    currentLevel: UNKNOW_LEVEL,
    dataList: null
  },
  onLoad: function(options) {
    that = this;
    //天气页面添加城市标识
    var add = null;
    if (options.add != null) {
      add = options.add
    }
    //内存中有天气信息，跳转到天气页面
    if (!add && app.globalData.weatherList) { //非页面添加城市且内存中有天气记录
      wx.redirectTo({
        url: '../weather/weather' //未传索引，默认未0
      })
      return
    }
    //省份列表
    if (app.globalData.provinceList) {
      provinceList = app.globalData.provinceList
      that.setData({
        currentLevel: PROVINCE_LEVEL,
        dataList: app.globalData.provinceList
      })
    } else {
      //异步请求回调
      wx.showLoading({
        title: '正在初始化...'
      })
      app.globalData.callback = res => { //省份列表请求成功回调函数
        wx.hideLoading()
        clearTimeout(timer)
        provinceList = res.data
        that.setData({
          dataList: res.data,
          currentLevel: PROVINCE_LEVEL
        })
      }
      timer = setTimeout(function() { //10秒后再次检查省份列表，还为空则提示网络错误
        wx.hideLoading()
        if (that.provinceList == null) { //逻辑：请求成功时先执行回调函数
          app.showErrorToast('请检查网络设置') //请求失败不执行回调函数，10s后执行超时函数，提示用户错误
        }
      }, 5000, null)
    }
    if (app.globalData.sessionId) { //通过sessionId存在与否判断登录状态
      that.setData({
        userInfo: app.globalData.userInfo,
        isLogin: true
      })
    } else { //app.js中未获取到：1.用户未授权 2.获取延迟 3.网络错误
      var count = 0;
      //设置一个定时器，1s执行一次，共执行10次，查看获取到的用户信息情况
      timer1 = setInterval(function() {
        if (count++ > 10) { //循环十次
          clearInterval(timer1)
          return;
        }
        if (app.globalData.sessionId) { //获取到了用户信息，关闭定时器
          that.setData({
            userInfo: app.globalData.userInfo,
            isLogin: true
          })
          clearInterval(timer1)
        }
      }, 1000, count)
    }

    wx.onNetworkStatusChange(function(res) { //注册网络监听器
      if (!res.isConnected) { //网络断开
        that.setData({
          isLogin: false,
          userInfo: null
        })
      } else if (res.isConnected) { //网络连接
        var count = 0;
        //设置一个定时器，1s执行一次，共执行10次，查看获取到的用户信息情况
        timer1 = setInterval(function() {
          if (count++ > 10) { //循环十次
            clearInterval(timer1)
            return;
          }
          if (app.globalData.sessionId) { //获取到了用户信息，关闭定时器
            that.setData({
              userInfo: app.globalData.userInfo,
              isLogin: true
            })
            clearInterval(timer1)
          }
        }, 1000, count)
      }
    })
  },
  doBindTap: function(e) {
    if (doTap) return;
    doTap = true;
    if (that.data.currentLevel == PROVINCE_LEVEL) {
      selectProvince = e.target.dataset.id
      provinceName = e.target.dataset.name
      wx.request({
        url: baseUri + '/' + selectProvince,
        success: res => {
          cityList = res.data;
          wx.setNavigationBarTitle({
            title: '' + provinceName,
          })
          that.setData({
            currentLevel: CITY_LEVEL,
            dataList: cityList
          })
        },
        fail: res => {
          app.showErrorToast('获取列表失败，请检查网络')
        },
        complete: res => {
          doTap = false;
        }
      })
    } else if (that.data.currentLevel == CITY_LEVEL) {
      selectCity = e.target.dataset.id
      cityName = e.target.dataset.name
      wx.request({
        url: baseUri + '/' + selectProvince + '/' + selectCity,
        success: res => {
          wx.setNavigationBarTitle({
            title: '' + cityName,
          })
          that.setData({
            currentLevel: COUNTRY_LEVEL,
            dataList: res.data
          })
        },
        fail: res => {
          app.showErrorToast('获取列表失败，请检查网络')
        },
        complete: res => {
          doTap = false;
        }
      })
    } else if (that.data.currentLevel == COUNTRY_LEVEL) {
      var weatherId = e.target.dataset.weatherid
      if (!weatherId) {
        doTap = false;
        return;
      }
      if (!app.globalData.sessionId) { //未登录，不跳转
        app.showErrorToast('请先登录')
        doTap = false;
        return;
      }
      wx.showLoading({
        title: '正在加载城市天气...'
      })
      setTimeout(function(){wx.hideLoading()},2000,null)
      wx.request({ //点击登录后立即点击城市可能会造成未登录假象
        url: baseWeatherUri + "?cityid=" + weatherId + "&key=" + key,
        success: res => {
          //将获取到的天气
          var index = -1;
          //初始化weatherList对象
          if (!app.globalData.weatherList) {
            console.log('weatherList is null')
            app.globalData.weatherList = new Array()
          }
          //对当前选择城市查看是否在已选城市之列
          for (var i = 0; i < app.globalData.weatherList.length; i++) {
            if (weatherId == app.globalData.weatherList[i].HeWeather[0].basic.cid) {
              console.log('find same city ,then instead of it')
              app.globalData.weatherList[i] = res.data
              index = i + 1;
              break;
            }
          }
          wx.request({ //登录了，请求添加偏爱城市 返回结果：1.添加成功 2.添加失败 3.登录超时
            url: 'http://localhost/user/addCity',
            header: {
              'Cookie': 'JSESSIONID=' + app.globalData.sessionId
            },
            data: {
              city: res.data.HeWeather[0].basic.location
            },
            success: result => {
              if (result.data.status == 0) { //添加成功
                if (index == -1) {
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
              } else if (result.data.status == 1) { //登录超时
                wx.hideLoading()
                wx.showModal({
                  title: '登录超时',
                  content: '从服务器断开，重新登录',
                  showCancel: false,
                  confirmText: '确定',
                  success: function(res) {
                    app.loginToServer()
                  },
                })
              } else { //添加失败
                app.showErrorToast('系统错误')
              }
            }
          })
        },
        fail: res => {
          app.showErrorToast('请检查网络设置')
        },
        complete: res => {
          doTap = false;
        }
      })
    }
  },
  returnTap: function(e) {
    if (doTap) return;
    doTap = true;
    if (that.data.currentLevel == PROVINCE_LEVEL) {
      app.showErrorToast('无法返回，已经是最顶层')
    } else if (that.data.currentLevel == CITY_LEVEL) {
      wx.setNavigationBarTitle({
        title: '',
      })
      that.setData({
        currentLevel: PROVINCE_LEVEL,
        dataList: provinceList
      })
    } else if (that.data.currentLevel == COUNTRY_LEVEL) {
      wx.setNavigationBarTitle({
        title: '' + cityName,
      })
      that.setData({
        currentLevel: CITY_LEVEL,
        dataList: cityList
      })
    }
    doTap = false;
  },
  doBindGetUserInfo: function(e) {
    clearInterval(timer1)
    if (e.detail.userInfo) { //登录按钮点击后成功用户授权并获取到用户信息
      app.globalData.userInfo = e.detail.userInfo
      app.loginToServer(function() {
        console.log('callback is call')
        that.setData({
          isLogin: true,
          userInfo: app.globalData.userInfo
        })
      })
    } else { //用户未授权或取得用户信息失败
      app.showErrorToast('登录失败')
    }
  }
})