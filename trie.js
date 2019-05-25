let graph = d3.select("#trie").selectAll("circle");
let svgCanvas = document.getElementById("trie");
const WIDTH = parseInt(svgCanvas.getAttribute("width"))
const radius = 16;
let inputField = document.getElementById("input")
let submitButon = document.getElementById("submit") 
let searchField = document.getElementById("search")
let searchText = document.getElementById("searchText")


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
        const nodePosition = (width/(1+nChildren));
        const nodeSpace = (width/nChildren);

       

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

let root = new TrieNode(undefined,{});


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

root.renderChildren(0, 0, WIDTH, WIDTH/2, 0);



function searchTrie(){
    let search = searchField.value;

    //if the seachField is empty then return to default text
    if(search.length < 1){
        searchText.innerHTML = "Type a word you have added to the Trie and see if it is in the Trie and if it has any valid characters that follow it."
        return;
    }

    //search the tree to see if the node is in the Trie
    let searchInTree = true;
    let currentNode = root;
    searchText.innerHTML = "";
    for(let ch of search.toUpperCase()){
        
        if(currentNode.hasChild(ch)){
            currentNode = currentNode.children[ch];
        }
        else{
            searchInTree = false;
            break;
        }
    }

    //respond with whether their search term is in the Trie, and if it is then what the next valid characters are
    let nChildren = Object.keys(currentNode.children).length;
    if(searchInTree){
        
        searchText.innerHTML = search + " is in the Trie. <br><br>";
        searchText.innerHTML += "The next valid characters are: <br><br>";

        let firstChar = true;

        for(let i = 0; i < nChildren; i++){
            if(firstChar)
                firstChar = false;
            else
                searchText.innerHTML += ", ";

            searchText.innerHTML += currentNode.children[Object.keys(currentNode.children)[i]].value;
        }


    }
    else{
        searchText.innerHTML = search + " is not the Trie. Search for a different string. <br><br>";
    }

}
