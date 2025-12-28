Set WshShell = CreateObject("WScript.Shell")
' Get the directory of this script
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
' Run START_POS.bat from that directory, with window style 0 (Hidden)
WshShell.Run chr(34) & strPath & "\START_POS.bat" & Chr(34), 0
Set WshShell = Nothing
