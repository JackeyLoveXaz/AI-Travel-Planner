import { useState, useEffect, useRef } from 'react';
import '../styles/MapPage.css';

function MapPage() {
  const [amapApiKey, setAmapApiKey] = useState('');
  const [amapSecurityKey, setAmapSecurityKey] = useState('');
  const [map, setMap] = useState(null);
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapContainerRef = useRef(null);
  const scriptRef = useRef(null);

  // 加载保存的高德地图API Key和安全密钥
  useEffect(() => {
    const savedKey = localStorage.getItem('aiTravelPlannerAmapApiKey');
    const savedSecurityKey = localStorage.getItem('aiTravelPlannerAmapSecurityKey');
    if (savedKey) {
      setAmapApiKey(savedKey);
    }
    if (savedSecurityKey) {
      setAmapSecurityKey(savedSecurityKey);
    }
  }, []);

  // 初始化地图
  useEffect(() => {
    if (!amapApiKey || map) return;

    setLoading(true);
    setError('');

    // 移除之前的脚本
    if (scriptRef.current) {
      scriptRef.current.remove();
    }

    // 创建新的脚本标签加载高德地图API - 使用最新稳定版本并添加插件参数
    const script = document.createElement('script');
    // 如果有安全密钥，则添加到URL中 - 注意：URL中使用jscode参数名（高德Web API要求）
    const securityKeyParam = amapSecurityKey ? `&jscode=${amapSecurityKey}` : '';
    const apiUrl = `https://webapi.amap.com/maps?v=2.0&key=${amapApiKey}${securityKeyParam}&plugin=AMap.ToolBar,AMap.Scale,AMap.OverView,AMap.PlaceSearch,AMap.Driving,AMap.Marker,AMap.Geolocation`;
    
    console.log('加载高德地图API:', apiUrl);
    console.log('API Key存在:', !!amapApiKey, '安全密钥存在:', !!amapSecurityKey);
    
    script.src = apiUrl;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('高德地图API加载成功');
      if (window.AMap && mapContainerRef.current) {
        // 初始化地图 - 创建配置对象
        const mapConfig = {
          zoom: 13,
          center: [116.397428, 39.90923], // 默认北京
          resizeEnable: true
        };
        
        // 在地图配置中显式添加安全密钥
        if (amapSecurityKey) {
          // 确保安全密钥被正确传递
          mapConfig.securityJsCode = amapSecurityKey;
          console.log('已为地图实例配置安全密钥');
          // 同时确保全局配置中也有安全密钥
          window.AMap.securityJsCode = amapSecurityKey;
          console.log('已为全局AMap对象配置安全密钥');
        }
        
        console.log('地图配置信息:', JSON.stringify(mapConfig));
        
        // 创建地图实例
        const newMap = new window.AMap.Map(mapContainerRef.current, mapConfig);
        console.log('地图实例创建完成，配置信息:', { 
          hasSecurityKey: !!mapConfig.securityJsCode, 
          apiUrlUsed: apiUrl,
          securityKeyLength: amapSecurityKey?.length || 0
        });
        
        // 如果有安全密钥，尝试获取用户位置
        if (amapSecurityKey) {
          // 使用plugin方法加载Geolocation插件
          window.AMap.plugin('AMap.Geolocation', () => {
            const geolocation = new window.AMap.Geolocation({
              enableHighAccuracy: true, // 是否使用高精度定位
              timeout: 10000, // 定位超时时间
              showButton: true, // 显示定位按钮
              buttonPosition: 'RT', // 定位按钮位置
              buttonOffset: new window.AMap.Pixel(10, 20), // 定位按钮偏移量
              zoomToAccuracy: true // 定位成功后是否自动缩放地图
            });
            
            // 添加定位控件
            newMap.addControl(geolocation);
            
            // 尝试获取用户位置
            geolocation.getCurrentPosition((status, result) => {
              console.log('获取用户位置结果:', status, result);
              if (status === 'complete') {
                // 定位成功，移动地图到用户位置
                const position = [result.position.lng, result.position.lat];
                console.log('用户位置:', position);
                newMap.setCenter(position);
              } else {
                console.warn('定位失败，将使用默认位置:', result.info);
              }
            });
          });
        }

        // 使用plugin方法加载控件
        window.AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
          // 添加控件
          newMap.addControl(new window.AMap.ToolBar());
          newMap.addControl(new window.AMap.Scale());
          
          // 单独处理OverView，因为在2.0版本中的加载方式可能不同
          try {
            window.AMap.plugin(['AMap.OverView'], () => {
              if (window.AMap.OverView) {
                newMap.addControl(new window.AMap.OverView());
              } else {
                console.warn('AMap.OverView 不可用，跳过该控件');
              }
            });
          } catch (error) {
            console.warn('加载OverView控件失败:', error);
          }
        });

        setMap(newMap);
        setLoading(false);
      }
    };

    script.onerror = () => {
      setError('加载地图失败，请检查API Key是否正确');
      setLoading(false);
    };

    scriptRef.current = script;
    document.body.appendChild(script);

    // 清理函数
    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
      if (map) {
        map.destroy();
        setMap(null);
      }
    };
  }, [amapApiKey]);

  // 搜索地点
  const searchLocation = () => {
    // 增强前置条件验证
    if (!map) {
      console.error('搜索失败: 地图实例未初始化');
      setError('地图未完全加载，请稍后再试');
      return;
    }
    
    // 验证搜索关键词
    const trimmedDestination = destination?.trim();
    if (!trimmedDestination) {
      console.error('搜索失败: 未提供有效搜索关键词');
      setError('请输入搜索关键词');
      return;
    }
    
    // 验证API Key和安全密钥是否存在
    if (!amapApiKey) {
      console.error('搜索失败: 未配置API Key');
      setError('未配置高德地图API Key，请前往设置页面配置');
      return;
    }
    
    if (!amapSecurityKey) {
      console.warn('警告: 未配置安全密钥(securityJsCode)，可能导致搜索失败');
    }

    setLoading(true);
    setError('');
    console.log('搜索条件验证通过，准备执行搜索:', trimmedDestination);

    // 使用plugin方法加载PlaceSearch插件
    window.AMap.plugin(['AMap.PlaceSearch'], () => {
      try {
        console.log('PlaceSearch插件加载成功，开始初始化');
        console.log('搜索前API Key验证:', {
          apiKeyExists: !!amapApiKey,
          apiKeyLength: amapApiKey?.length,
          securityKeyExists: !!amapSecurityKey,
          securityKeyLength: amapSecurityKey?.length
        });
        
        // 创建搜索实例 - 显式传递安全密钥
        const placeSearchConfig = {
          map: map,
          panel: 'panel',
          autoFitView: true,
          // 确保在全局配置中设置安全密钥
          securityJsCode: amapSecurityKey || ''
        };
        
        // 显式记录配置信息
        console.log('PlaceSearch配置详情:', {
          hasMap: !!map,
          hasPanel: !!document.getElementById('panel'),
          hasSecurityKey: !!amapSecurityKey,
          securityKeyLength: amapSecurityKey?.length || 0
        });
        
        const placeSearch = new window.AMap.PlaceSearch(placeSearchConfig);

        console.log('PlaceSearch实例创建成功，准备执行搜索:', trimmedDestination);
        
        // 执行搜索
        placeSearch.search(trimmedDestination, (status, result) => {
          console.log('搜索结果:', status, result);
          setLoading(false);
          
          if (status === 'complete') {
            if (result.info === 'OK') {
              if (result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
                // 显示面板
                const panel = document.getElementById('panel');
                if (panel) panel.style.display = 'block';
                
                // 获取第一个搜索结果的经纬度
                const firstLocation = result.poiList.pois[0].location;
                const placeName = result.poiList.pois[0].name;
                console.log('找到地点:', placeName, firstLocation);
              } else {
                // 隐藏面板
                const panel = document.getElementById('panel');
                if (panel) panel.style.display = 'none';
                // 提供更详细的搜索无结果提示，并包含有用信息
                setError(`未找到相关地点: "${destination}"。请尝试使用其他关键词，或检查拼写是否正确。`);
              }
            } else {
              // 特殊处理各种API Key相关错误
              if (result && result.code === '10001' || status === 'error' && result && result.info === 'USERKEY_PLAT_NOMATCH') {
                setError('API Key平台不匹配，请确保使用的是Web端(JavaScript API)的API Key');
                console.error('API Key平台不匹配错误:', status, result);
              } else if (status === 'error' && result && (result.info === 'INVALID_USER_SCODE' || String(result.info).includes('INVALID_USER_SCODE'))) {
                        // 更详细的错误信息，帮助用户排查问题
                        const errorMsg = `API Key服务码无效(INVALID_USER_SCODE)，请按以下步骤检查：
1) 请确认您的API Key已在高德开放平台正确申请并启用
2) 请确认该API Key已开通PlaceSearch和Driving等相关服务
3) 请确认安全密钥(securityJsCode)与API Key完全匹配
4) 请确认您使用的是Web端JavaScript API的Key，而非其他平台的Key
5) 如需重置，请前往设置页面重新配置API Key和安全密钥`;
                        setError(errorMsg);
                        console.error('API Key服务码无效错误:', status, result);
                        console.log('使用的API Key信息:', amapApiKey ? `${amapApiKey.substring(0, 8)}... (长度: ${amapApiKey.length})` : '未配置');
                        console.log('安全密钥配置状态:', amapSecurityKey ? '已配置' : '未配置');
                        console.log('完整错误响应:', JSON.stringify(result));
              } else {
                // 提供更详细的错误信息，确保即使在result.info为空时也能显示有意义的错误
                setError(`搜索失败: ${result && (result.info || result.message || result.error || '未知错误')}`);
              }
            }
          } else {
            // 特殊处理各种API Key相关错误
            if (result && result.code === '10001' || status === 'error' && result && result.info === 'USERKEY_PLAT_NOMATCH') {
              setError('API Key平台不匹配，请确保使用的是Web端(JavaScript API)的API Key');
              console.error('API Key平台不匹配错误:', status, result);
            } else if (status === 'error' && result && (result.info === 'INVALID_USER_SCODE' || String(result.info).includes('INVALID_USER_SCODE'))) {
              // 更详细的错误信息，帮助用户排查问题
                const errorMsg = `API Key服务码无效(INVALID_USER_SCODE)，请按以下步骤检查：
1) 请确认您的API Key已在高德开放平台正确申请并启用
2) 请确认该API Key已开通PlaceSearch和Driving等相关服务
3) 请确认安全密钥(securityJsCode)与API Key完全匹配
4) 请确认您使用的是Web端JavaScript API的Key，而非其他平台的Key
5) 如需重置，请前往设置页面重新配置API Key和安全密钥`;
                setError(errorMsg);
                console.error('API Key服务码无效错误:', status, result);
                console.log('使用的API Key信息:', amapApiKey ? `${amapApiKey.substring(0, 8)}... (长度: ${amapApiKey.length})` : '未配置');
                console.log('安全密钥配置状态:', amapSecurityKey ? '已配置' : '未配置');
                console.log('完整错误响应:', JSON.stringify(result));
            } else {
              // 提供更详细的错误信息，特别是当status为error时
              // 提供更详细的错误信息，提取result对象中可能存在的多种错误信息字段
              if (status === 'error') {
                setError(`搜索请求失败: ${result && (result.info || result.message || result.error || '未知错误')}`);
              } else {
                // 即使status不是error，也尝试从result中获取更多信息
                setError(`搜索请求失败: ${status || (result && (result.info || result.message || result.error)) || '未知错误'}`);
              }
              console.error('===== 搜索请求失败详情 =====');
              console.error('状态码:', status);
              console.error('错误结果对象:', result);
              console.error('错误信息:', result ? result.info : '无错误信息');
              console.error('错误码:', result ? result.code : '无错误码');
              console.error('搜索参数:', { destination: destination, trimmedDestination: trimmedDestination });
              console.error('API配置状态:', { 
                apiKeyExists: !!amapApiKey, 
                apiKeyLength: amapApiKey?.length,
                securityKeyExists: !!amapSecurityKey,
                securityKeyLength: amapSecurityKey?.length,
                globalSecurityKeyExists: !!window.AMap?.securityJsCode
              });
              console.error('完整错误响应JSON:', JSON.stringify(result));
              // API URL未定义，移除这行日志以避免错误
              console.error('==============================');
              
              // 特殊处理INVALID_USER_SCODE错误，提供更具体的帮助信息
              if (String(result).includes('INVALID_USER_SCODE')) {
                console.error('诊断分析: INVALID_USER_SCODE错误通常表示安全密钥(securityJsCode)与API Key不匹配或未正确配置');
                console.error('请确认: 1) 安全密钥与API Key来自同一应用 2) API Key已开通相关服务 3) 配置方式符合高德API要求');
              }
            }
          }
        });
      } catch (error) {
        console.error('搜索执行异常:', error);
        console.error('异常详细信息:', { message: error.message, stack: error.stack });
        console.log('异常发生时的API状态:', { apiKeyExists: !!amapApiKey, securityKeyExists: !!amapSecurityKey });
        setLoading(false);
        // 检查是否包含INVALID_USER_SCODE错误信息
        if (error && (error.message === 'INVALID_USER_SCODE' || String(error).includes('INVALID_USER_SCODE'))) {
          const errorMsg = `API Key服务码无效(INVALID_USER_SCODE)，请按以下步骤检查：\n1) 请确认您的API Key已在高德开放平台正确申请并启用\n2) 请确认该API Key已开通PlaceSearch和Driving等相关服务\n3) 请确认安全密钥(securityJsCode)与API Key完全匹配\n4) 请确认您使用的是Web端JavaScript API的Key，而非其他平台的Key\n5) 如需重置，请前往设置页面重新配置API Key和安全密钥`;
          setError(errorMsg);
        } else {
          setError('搜索执行异常，请稍后重试');
        }
      }
    });
  };

  // 导航到指定地点
  const navigateToLocation = () => {
    if (!map || !destination) return;

    setLoading(true);
    setError('');

    // 同时加载Driving和PlaceSearch插件
    window.AMap.plugin(['AMap.Driving', 'AMap.PlaceSearch'], () => {
      try {
        // 创建Driving实例 - 显式传递安全密钥
        const drivingConfig = {
          map: map,
          panel: 'panel',
          autoFitView: true,
          // 确保安全密钥始终被配置
          securityJsCode: amapSecurityKey || ''
        };
        
        // 显式记录Driving配置信息
        console.log('Driving配置详情:', {
          hasMap: !!map,
          hasPanel: !!document.getElementById('panel'),
          hasSecurityKey: !!amapSecurityKey,
          securityKeyLength: amapSecurityKey?.length || 0
        });
        
        const driving = new window.AMap.Driving(drivingConfig);

        // 获取地图中心点作为起点
        const startPoint = map.getCenter();
        
        // 创建搜索实例来获取终点坐标 - 显式传递安全密钥
        const placeSearchConfig = {
          // 确保安全密钥始终被配置
          securityJsCode: amapSecurityKey || ''
        };
        
        // 显式记录导航用PlaceSearch配置信息
        console.log('导航功能PlaceSearch配置详情:', {
          hasSecurityKey: !!amapSecurityKey,
          securityKeyLength: amapSecurityKey?.length || 0
        });
        
        const placeSearch = new window.AMap.PlaceSearch(placeSearchConfig);
        
        console.log('导航搜索地点:', destination);
        
        // 执行搜索
        placeSearch.search(destination, (status, result) => {
          console.log('导航搜索结果:', status, result);
          
          if (status === 'complete') {
            if (result.info === 'OK') {
              if (result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
                // 显示面板用于导航结果
                const panel = document.getElementById('panel');
                if (panel) panel.style.display = 'block';
                
                const endPoint = result.poiList.pois[0].location;
                const endName = result.poiList.pois[0].name;
                
                console.log('开始导航规划:', startPoint, '到', endName, endPoint);
                
                // 执行导航
                driving.search([
                  {keyword: '当前位置', location: startPoint},
                  {keyword: endName, location: endPoint}
                ], (status, result) => {
                  console.log('导航规划结果:', status, result);
                  setLoading(false);
                  
                  if (status === 'complete') {
                    if (result.info === 'OK') {
                      console.log('导航规划成功');
                      // 适配2.0版本的结果处理
                      if (result.routes && result.routes.length > 0) {
                        console.log('找到路线数量:', result.routes.length);
                      }
                    } else {
                      // 特殊处理各种API Key相关错误
                      if (result && result.code === '10001' || status === 'error' && result && result.info === 'USERKEY_PLAT_NOMATCH') {
                        setError('API Key平台不匹配，请确保使用的是Web端(JavaScript API)的API Key');
                        console.error('API Key平台不匹配错误:', status, result);
                      } else if (status === 'error' && result && (result.info === 'INVALID_USER_SCODE' || String(result.info).includes('INVALID_USER_SCODE'))) {
                        // 更详细的错误信息，帮助用户排查问题
                        const errorMsg = `API Key服务码无效(INVALID_USER_SCODE)，请按以下步骤检查：
1) 请确认您的API Key已在高德开放平台正确申请并启用
2) 请确认该API Key已开通PlaceSearch和Driving等相关服务
3) 请确认安全密钥(securityJsCode)与API Key完全匹配
4) 请确认您使用的是Web端JavaScript API的Key，而非其他平台的Key
5) 如需重置，请前往设置页面重新配置API Key和安全密钥`;
                        setError(errorMsg);
                        console.error('API Key服务码无效错误:', status, result);
                        console.log('使用的API Key信息:', amapApiKey ? `${amapApiKey.substring(0, 8)}... (长度: ${amapApiKey.length})` : '未配置');
                        console.log('安全密钥配置状态:', amapSecurityKey ? '已配置' : '未配置');
                        console.log('完整错误响应:', JSON.stringify(result));
                      } else {
                        setError(`导航规划失败: ${result.info || '未知错误'}`);
                      }
                    }
                  } else {
                    // 特殊处理各种API Key相关错误
                    if (result && result.code === '10001' || status === 'error' && result && result.info === 'USERKEY_PLAT_NOMATCH') {
                      setError('API Key平台不匹配，请确保使用的是Web端(JavaScript API)的API Key');
                      console.error('API Key平台不匹配错误:', status, result);
                    } else if (status === 'error' && result && (result.info === 'INVALID_USER_SCODE' || String(result.info).includes('INVALID_USER_SCODE'))) {
                  // 更详细的错误信息，帮助用户排查问题
                  const errorMsg = `API Key服务码无效(INVALID_USER_SCODE)，请按以下步骤检查：
1) 请确认您的API Key已在高德开放平台正确申请并启用
2) 请确认该API Key已开通PlaceSearch和Driving等相关服务
3) 请确认安全密钥(securityJsCode)与API Key完全匹配
4) 请确认您使用的是Web端JavaScript API的Key，而非其他平台的Key
5) 如需重置，请前往设置页面重新配置API Key和安全密钥`;
                  setError(errorMsg);
                  console.error('API Key服务码无效错误:', status, result);
                  console.log('使用的API Key信息:', amapApiKey ? `${amapApiKey.substring(0, 8)}... (长度: ${amapApiKey.length})` : '未配置');
                  console.log('安全密钥配置状态:', amapSecurityKey ? '已配置' : '未配置');
                  console.log('完整错误响应:', JSON.stringify(result));
                    } else {
                      // 提供更详细的错误信息，特别是当status为error时
                      if (status === 'error') {
                        setError(`导航请求失败: ${result && result.info ? result.info : '未知错误'}`);
                      } else {
                        setError(`导航请求失败: ${status}`);
                      }
                      console.error('导航请求失败详情:', status, result);
                    }
                  }
                });
              } else {
                setLoading(false);
                const panel = document.getElementById('panel');
                if (panel) panel.style.display = 'none';
                setError('未找到指定地点，请尝试其他关键词');
              }
            } else {
              setLoading(false);
              // 特殊处理各种API Key相关错误
              if (result && result.code === '10001' || status === 'error' && result && result.info === 'USERKEY_PLAT_NOMATCH') {
                setError('API Key平台不匹配，请确保使用的是Web端(JavaScript API)的API Key');
                console.error('API Key平台不匹配错误:', status, result);
              } else if (status === 'error' && result && (result.info === 'INVALID_USER_SCODE' || String(result.info).includes('INVALID_USER_SCODE'))) {
                  // 更详细的错误信息，帮助用户排查问题
                  const errorMsg = `API Key服务码无效(INVALID_USER_SCODE)，请按以下步骤检查：
1) 请确认您的API Key已在高德开放平台正确申请并启用
2) 请确认该API Key已开通PlaceSearch和Driving等相关服务
3) 请确认安全密钥(securityJsCode)与API Key完全匹配
4) 请确认您使用的是Web端JavaScript API的Key，而非其他平台的Key
5) 如需重置，请前往设置页面重新配置API Key和安全密钥`;
                  setError(errorMsg);
                  console.error('API Key服务码无效错误:', status, result);
                  console.log('使用的API Key信息:', amapApiKey ? `${amapApiKey.substring(0, 8)}... (长度: ${amapApiKey.length})` : '未配置');
                  console.log('安全密钥配置状态:', amapSecurityKey ? '已配置' : '未配置');
                  console.log('完整错误响应:', JSON.stringify(result));
              } else {
                setError(`搜索地点失败: ${result.info || '未知错误'}`);
              }
            }
          } else {
            setLoading(false);
            // 特殊处理各种API Key相关错误
            if (result && result.code === '10001' || status === 'error' && result && result.info === 'USERKEY_PLAT_NOMATCH') {
              setError('API Key平台不匹配，请确保使用的是Web端(JavaScript API)的API Key');
              console.error('API Key平台不匹配错误:', status, result);
            } else if (status === 'error' && result && (result.info === 'INVALID_USER_SCODE' || String(result.info).includes('INVALID_USER_SCODE'))) {
              const errorMsg = 'API Key服务码无效，请检查：1) 您的API Key是否已正确启用 2) 服务是否未被禁用 3) 安全密钥是否与API Key匹配';
              setError(errorMsg);
              console.error('API Key服务码无效错误:', status, result, '完整错误信息:', JSON.stringify(result));
            } else {
              setError(`搜索请求失败: ${status || '未知错误'}`);
              console.error('导航搜索请求失败详情:', status, result);
            }
          }
        });
      } catch (error) {
        console.error('导航搜索执行异常:', error);
        setLoading(false);
        // 检查是否包含INVALID_USER_SCODE错误信息
        if (error && (error.message === 'INVALID_USER_SCODE' || String(error).includes('INVALID_USER_SCODE'))) {
          const errorMsg = `API Key服务码无效(INVALID_USER_SCODE)，请按以下步骤检查：
1) 请确认您的API Key已在高德开放平台正确申请并启用
2) 请确认该API Key已开通PlaceSearch和Driving等相关服务
3) 请确认安全密钥(securityJsCode)与API Key完全匹配
4) 请确认您使用的是Web端JavaScript API的Key，而非其他平台的Key
5) 如需重置，请前往设置页面重新配置API Key和安全密钥`;
          setError(errorMsg);
        } else {
          setError('导航搜索执行异常，请稍后重试');
        }
      }
    });
  };

  // 验证API Key格式是否正确
  const isValidApiKey = amapApiKey && amapApiKey.trim().length > 0 && /^[a-zA-Z0-9_\-]{10,50}$/.test(amapApiKey);
  
  // 如果没有API Key或格式不正确，显示提示信息
  if (!isValidApiKey) {
    return (
      <div className="map-page">
        <h1>地图</h1>
        <div className="no-api-key">
          <p>请先在设置页面添加有效的高德地图API Key</p>
          <p className="api-key-hint">提示：请确保使用的是Web端(JavaScript API)的API Key</p>
          <a href="/settings">前往设置页面</a>
          {amapApiKey && !isValidApiKey && <p className="api-key-error">当前API Key格式不正确，请检查</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      <h1>地图</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="search-container">
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="输入地点名称"
            className="search-input"
          />
          <button onClick={searchLocation} className="search-button" disabled={loading}>
            {loading ? '搜索中...' : '搜索地点'}
          </button>
          <button onClick={navigateToLocation} className="navigate-button" disabled={loading}>
            {loading ? '导航中...' : '导航到该地点'}
          </button>
          <div className="api-key-reminder">
            <small>请确保使用的是Web端(JavaScript API)的API Key</small>
            {!amapSecurityKey && <small style={{display: 'block', marginTop: '5px', color: '#ff9800'}}>提示：设置安全密钥可以获取您的精确位置</small>}
          </div>
        </div>
      
      <div className="map-content">
        <div id="map-container" ref={mapContainerRef} className="map-container">
          {loading && <div className="loading">加载地图中...</div>}
        </div>
        <div id="panel" className="panel"></div>
      </div>
    </div>
  );
}

export default MapPage;