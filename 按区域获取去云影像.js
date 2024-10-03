// 定义研究区为山西省
var roi = ee.FeatureCollection("users/");

// 去云函数
function maskL8sr(image) {
    var qa = image.select('QA_PIXEL');  // 使用 'QA_PIXEL' 波段  
    var cloudShadowBitMask = (1 << 3);  // 云影位  
    var cloudsBitMask = (1 << 5);       // 云位  
    var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
        .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
    return image.updateMask(mask);
}

// 获取去云前的Landsat 8影像
var l8SR_Pre = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(roi)
    .filterDate('2022-01-01', '2022-12-31')
    .select(['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7', 'ST_B10'])
    .median()   // 中值合成                  
    .clip(roi);
print("2022 去云前影像", l8SR_Pre);

// 获取去云后的Landsat 8影像
var l8SR_Post = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(roi)
    .filterDate('2022-01-01', '2022-12-31')
    .map(maskL8sr)  // 应用去云函数                  
    .select(['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7', 'ST_B10'])
    .median()   // 中值合成                  
    .clip(roi);
print("2022 去云后影像", l8SR_Post);

// 可视化参数
var rgbVis = {
    min: 0.0,
    max: 3000,
    gamma: 1.4,
    bands: ['SR_B4', 'SR_B3', 'SR_B2'],  // 可见光波段
};

// 添加去云前影像到地图
Map.addLayer(l8SR_Pre, rgbVis, '2022 去云前影像');

// 添加去云后影像到地图
Map.addLayer(l8SR_Post, rgbVis, '2022 去云后影像');

// 调整地图中心
Map.centerObject(roi, 7);

// 显示边界
var styling = { color: "red", fillColor: "00000000" };
Map.addLayer(roi.style(styling), {}, "研究区边界");

// 导出去云前影像
Export.image.toDrive({
    image: l8SR_Pre.select('SR_B4', 'SR_B3', 'SR_B2'),
    description: '2022_Pre_Cloud_L8SR',
    crs: "EPSG:4326",
    scale: 500,
    region: roi,
    maxPixels: 1e13,
    folder: 'shanxi'
});

// 导出去云后影像
//var enhancedImage = l8SR.multiply(1.5); 
Export.image.toDrive({
    image: l8SR_Post.select('SR_B4', 'SR_B3', 'SR_B2'),
    description: '2022_Post_Cloud_L8SR',
    crs: "EPSG:4326",
    scale: 500,
    region: roi,
    maxPixels: 1e13,
    folder: 'shanxi'
});