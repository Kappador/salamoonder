#!/bin/bash  
tsc

git add .  
read -p "Commit description: " desc  
git commit -m "$desc"  
git push origin master

npm publish --access public