let graph = d3.select("#trie").selectAll("circle");
let svgCanvas = document.getElementById("trie");
const WIDTH = parseInt(svgCanvas.getAttribute("width"))
const radius = 16;
let inputField = document.getElementById("input")
let submitButon = document.getElementById("submit") 
let searchField = document.getElementById("search")
let searchText = document.getElementById("searchText")
let read = new FileReader();


class TrieNode{
    //value is a character denoting the letter in the trie
    //children is a dictionary that maps a letter to its TrieNode which is a child of this TrieNode
    constructor(value, children){
        this.value = value;
        this.children = children;
    }

    addChild(node){
        this.children[node.value] = node;
        return node;
    }
    hasChild(key){
        if(key in this.children)
            return true;
        else
            return false;
    }
    renderChildren(height, startX, width, parentX, parentY){
        let C = this.children;
        const nChildren = Object.keys(this.children).length;
        const nodePosition = (width/(nChildren+1));
        const nodeSpace = (width/(nChildren));

       

        //draw lines from current node to child IF you are not the root. This is called before renderChildren so it will be drawn on the bottom layer.
        if(height != 0)
        graph.data(d3.keys(this.children)).enter()
            .append("line")
            .attr("x1", parentX)
            .attr("y1",  parentY)
            .attr("x2",function(d,i){
                return startX + (nodePosition * (i+1));
            })
            .attr("y2",  50 * (height+1)-25)
            .attr("stroke", "black")
            .attr("stroke-width", 0)
            .transition()
            .duration(1000)
            .attr("stroke-width", 2);
        
        //call renderChildren on all children
        for(let i = 0; i < nChildren; i++){
            this.children[Object.keys(this.children)[i]].renderChildren(
                height+1,
                startX + nodeSpace * i,
                nodeSpace,
                startX + (nodePosition * (i+1)),
                30 + 50 * height
            )
        }
        //everything past this is drawn on the calls back down the callstack
        //draw circles
        graph.data(d3.keys(this.children)).enter()
            .append("circle")
            .attr("cx",function(d,i){
                return startX + (nodePosition * (i+1));
            })
            .attr("cy", 25 + 50 * height)
            .attr("r",0)
            .transition()
            .duration(1000)
            .attr("r",radius);
        
        //draw text
        graph.data(d3.keys(this.children)).enter()
            .append("text")
            .attr("text-anchor","middle")
            .attr("x",function(d,i){
                return startX + (nodePosition * (i+1));
            })
            .attr("y", 30 + 50 * height)
            .text(function(d,i){
                if(C[Object.keys(C)[i]] != undefined){
                    return C[Object.keys(C)[i]].value;
                }
                else{
                    return "undef";
                }
            })
            .attr("font-family", "Courier New")
            .attr("font-weight", 550)
            .attr("font-size", 20 + "px")
            .attr("fill", "white")
            .attr("fill-opacity", 0)
            .transition()
            .duration(1000)
            .attr("fill-opacity", 1)
    }
}

let root = new TrieNode('',{});
let currentSearchNode = root;


function addWord(){
    let word = inputField.value.toUpperCase();
    let currentNode = root;
    let newCount = 0;
    let hasChanged = false;

    for(let ch of word){
        //if theres a space then its a new word: move back to root
        if(ch == ' '){
            currentNode = root;
            continue;
        }
        //if theres already a node for the letter then move to that one
        if(currentNode.hasChild(ch)){
            currentNode = currentNode.children[ch];
        }
        //else, create a node for the new letter and switch to it
        else{
            currentNode = currentNode.addChild(new TrieNode(ch,{}));
            newCount++;
            hasChanged = true;
        }

    }
    console.log(root);
    console.log(newCount + " new TrieNodes added");
    if(hasChanged){
        d3.selectAll("line").remove();
        d3.selectAll("text").remove();
        d3.selectAll("circle").remove();
        root.renderChildren(0, 0, WIDTH);
    }
    
}

function renderRoot(){
    d3.selectAll("line").remove();
    d3.selectAll("text").remove();
    d3.selectAll("circle").remove();
    root.renderChildren(0, 0, WIDTH, WIDTH/2, 0);
}



function searchTrie(){
    let search = searchField.value;
    
    //if the seachField is empty then return to default text
    if(search.length < 1){
        searchText.innerHTML = "Type a word you have added to the Trie and see if it is in the Trie and if it has any valid characters that follow it."
        currentSearchNode = root;
        return;
    }
    

    let newSearchCharacter = search.substring(search.length-1).toUpperCase();

    //search the tree to see if the node is in the Trie
    let searchInTree = true;

    let currentNode = currentSearchNode;
    

    //if the new letter is a child of the node we looked at during the previous search, we can start from there instead of starting over from root.
    //O(1)
    if(newSearchCharacter in currentSearchNode.children){
        currentNode = currentNode.children[newSearchCharacter];
        currentSearchNode = currentNode;
        console.log("O(1)")
    }
    else{
        //start over from root = O(length of search)
        console.log("O(N)")
        currentNode = root;
        for(let ch of search.toUpperCase()){
            
            if(currentNode.hasChild(ch)){
                currentNode = currentNode.children[ch];
                currentSearchNode = currentNode;
            }
            else{
                searchInTree = false;
                break;
            }
        }
    }

    //respond with whether their search term is in the Trie, and if it is then what the next valid characters are
    searchText.innerHTML = "";
    let nChildren = Object.keys(currentNode.children).length;
    if(searchInTree){
        
        searchText.innerHTML = search + " is in the Trie. <br><br>";

        searchText.innerHTML += "The next valid characters are: <br><br>";
        
        let firstChar = true;
        let nextValidCharactersHTML= "None";

        for(let i = 0; i < nChildren; i++){
            if(firstChar){
                nextValidCharactersHTML = "";
                firstChar = false;
            }
            else{
                nextValidCharactersHTML += ", ";
            }

            nextValidCharactersHTML += currentNode.children[Object.keys(currentNode.children)[i]].value;
        }
        searchText.innerHTML += nextValidCharactersHTML;


    }
    else{
        searchText.innerHTML = search + " is not the Trie. Search for a different string. <br><br>";
    }

}

//uses download.js to download JSON stingify-ed Trie
function downloadTrieJSON(){
    download(JSON.stringify(root),"TrieJSON.txt");
}

//called when user clicks submit button to upload text file
function uploadTrieJSON(){
    let fileInput = document.getElementById("fileInput");
    
    read.readAsText(fileInput.files[0]);
    read.addEventListener('load', function(){loadTrieJSON()});

}

//function is called once the fileReader finishes loading
function loadTrieJSON(){    
    console.log(read.result);
    treeJSON = JSON.parse(read.result);


    root = buildTreeFromJSONObject(treeJSON);

    renderRoot();
}

//recursive function, builds tree from the leaves up by parsing JSON (just gives general objects not TrieNodes) and forms a TrieNode tree that overwrites root.
function buildTreeFromJSONObject(object){
    
    let children = {};

    let JSONObjectKeys = Object.keys(object.children)
    let nChildren = JSONObjectKeys.length;

    for(let i = 0; i < nChildren; i++){
        let key = JSONObjectKeys[i];
        children[key] = buildTreeFromJSONObject(object.children[key])
    }
    
    return new TrieNode(object.value, children);

    
}

function timeRender(){
  console.time('renderRoot');
  renderRoot()
  console.timeEnd('renderRoot');
}