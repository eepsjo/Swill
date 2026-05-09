---
date: 1970-01-01 12:00:00+08:00
updated: 1970-01-01 12:00:00+08:00
---

# Windows

??? quote "警告！已过时项目"
    此项目内容已过时，含有大量笔者已经弃用的方法和理论，请读者知悉。

## 文件资源管理器相关

### 隐藏驱动器盘符
1. 打开注册表编辑器
   > `Win+R`，输入 `regedit`，回车
2. 导航至
   ```
   HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer
   ```
3. 创建或修改一个 DWORD (32 位) 值 `NoDrives`，将其赋值为一个十进制数字
   > 每个盘符对应一个二进位位：A: `1 (2^0)`、B: `2 (2^1)`、C: `4 (2^2)`，以此类推<br>如需隐藏多个盘符，将它们对应的十进制数字相加即可。如：隐藏 D:(`8`) + F:(`32`) + G:(`64`) = 十进制 `104`。

### 移除“3D 对象”文件夹
1. 打开注册表编辑器导航至
   ```
   HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace
   ```
2. 删除子项：`{0DB7E03F-FC29-4DC6-9020-FF41B59E513A}`
   > 重新启动文件资源管理器后生效。

### Windows 10 任务栏透明化
1. 打开注册表编辑器导航至
```
HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced
```
2. 创建或修改一个 DWORD (32 位) 值 `TaskbarAcrylicOpacity`，设置为 0
   > 建议搭配深色任务栏使用。

## 电源 & 睡眠

### 高级电源选项中的【USB 选择性暂停】
1. 打开注册表编辑器 (`Win+R` 输入 `regedit`)。

    * 导航至：`计算机\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Power\PowerSettings\2a7374-...\48e6b7-...`。

    * 创建或修改一个 DWORD (32 位) 值 `Attributes`，将其值设置为 2。

  说明：
    
    * 将 `Attributes` 设为 `2` 会使选项显示在“高级电源选项”界面中，具体设置还是需要去这里做。
    
    * S0 睡眠模式下该项为隐藏选项，下同。
    
    * 需要注意，`...\PowerSettings\2a7...` 后的 GUID 在不同的电脑或者不同的系统版本中可能不完全相同，但有相似之处。

### 高级电源选项中的【待机状态下的网络连接性】

  步骤：

    * 打开注册表编辑器 (`Win+R` 输入 `regedit`)。

    * 导航至：`计算机\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Power\PowerSettings\f15576e8-...`。

    * 创建或修改一个 DWORD (32 位) 值 `Attributes`，将其值设置为 2。

  说明： 
  
    * 此项为 S0 模式下电脑接入电源后能否深度睡眠的关键！

### 高级电源选项中的【允许使用唤醒计时器】

  步骤：

    * 打开注册表编辑器 (`Win+R` 输入 `regedit`)。

    * 导航至：`计算机\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Power\PowerSettings\238c9fa8-...\bd3b718a-...`。

    * 创建或修改一个 DWORD (32 位) 值 `Attributes`，将其值设置为 2。

  说明： 
  
    * 控制 Windows 维护任务是否能在睡眠中唤醒系统。

禁用离开模式 (Away Mode)

  步骤：

    * 打开注册表编辑器 (`Win+R` 输入 `regedit`)。

    * 导航至：`计算机\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Power`。

    * 创建或修改一个 DWORD (32 位) 值，将 `AwayModeEnabled` 设置为 0。

  说明： 
    
    * 禁用离开模式的全局设置。若要在高级电源选项中显示该策略，请将 `计算机\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Power\PowerSettings\238c9fa8-...\94ac6d29-...` 的策略的 `Attributes` 设为 2。

### 生成电池使用报告

  步骤：

    * 打开命令提示符或 PowerShell。

    * 执行以下命令：

    ```
    powercfg /batteryreport /output "<文件路径>\<文件名>.html"
    ```

## OTH

### 应用程序文件夹
1. 运行窗口输入 `shell:AppsFolder`，回车打开。

### 禁用任务管理器
1. 打开注册表编辑器导航至
```
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Policies\System
```
2. 建立或修改一个 DWORD (32 位) 值 `DisableTaskMgr`，设置为 1

### 移除 Windows 任务栏搜索中的推广内容
1. 打开注册表编辑器导航至
```
HKEY_CURRENT_USER\SOFTWARE\Policies\Microsoft\Windows\explorer
```
2. 建立或修改一个 DWORD (32 位) 值  `DisableSearchBoxSuggestions`，设置为 1。
   > 重新启动文件资源管理器后生效。

### Windows 11 “小组件”卸载/重新安装

  卸载：

    ```
    winget uninstall MicrosoftWindows.Client.WebExperience_cw5n1h2txyewy
    ```

  重新安装：

    ```
    winget install 9MSSGKG348SP
    ```
