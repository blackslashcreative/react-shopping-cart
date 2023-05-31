import React from 'react';
import axios from 'axios';
import {
  Card,
  Accordion,
  Button,
  Container,
  Row,
  Col,
  Image,
  Input
} from 'react-bootstrap';
import {
  apple,
  orange,
  beans,
  cabbage
} from '../img'

// simulate getting products from DataBase
const products = [
  { name: "Apples", country: "Italy", cost: 3, instock: 2 },
  { name: "Oranges", country: "Spain", cost: 4, instock: 1 },
  { name: "Beans", country: "USA", cost: 2, instock: 8 },
  { name: "Cabbage", country: "USA", cost: 1, instock: 3 },
];
//=========Cart=============
const Cart = (props) => {
  let list = [];
  let data = props.location.data ? props.location.data : products;
  // console.log(`data:${JSON.stringify(data)}`);

  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  // console.log(`useDataApi called`);
  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios.post(url);
        // console.log("FETCH FROM URL");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      console.log('FETCH_SUCCESS');
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = (props) => {
  const [items, setItems] = React.useState(products);
  const [cart, setCart] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  
  // Add To Cart
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item) => item.name == name);
    if (item[0].instock == 0) return;
    item[0].instock = item[0].instock - 1;
    // console.log(`add to Cart ${JSON.stringify(item)}`);
    setCart([...cart, ...item]);
  };
  const deleteCartItem = (index, item) => { 
    //console.log(`item... ${JSON.stringify(item)}`);
    item.instock = item.instock + 1;
    let newCart = cart.filter((item, i) => index != i);
    setCart(newCart);
  };
  const photos = [apple, orange, beans, cabbage];

  let list = items.map((item, index) => {

    return (
      <li key={index}>
        <Image src={photos[index % 4]} width={70} roundedCircle></Image>
        <Button variant="primary" size="large">
          {item.name} : {item.instock}
        </Button>
        <input name={item.name} type="submit" onClick={addToCart}></input>
      </li>
    );
  });
  let cartList = cart.map((item, index) => {
    return (
      <Accordion.Item key={1+index} eventkey={1 + index}>
      <Accordion.Header>
        {item.name}
      </Accordion.Header>
      <Accordion.Body item={item.name} onClick={() => deleteCartItem(index, item)}
        eventkey={1 + index}>
        $ {item.cost} from {item.country}
      </Accordion.Body>
    </Accordion.Item>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    // console.log(`total updated to ${newTotal}`);
    return newTotal;
  };

  // Implement the restockProducts function
  async function fetchRestockData(req, res) {
    const options = {
      method: 'POST',
      url: 'http://localhost:1337/graphql/',
      headers: {
        'content-type': 'application/json'
      },
      data: {
        query: `{
          products {
            data {
              attributes {
                name
                instock
              }
            }
          }
        }`
      }
    };
    axios
      .request(options)
      .then(function (response) {
        // console.log(`response.data: ${JSON.stringify(response.data)}`);
        restockProducts(response.data); // Response
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  const restockProducts = (data) => {
    let productData = data.data.products.data;
    //console.log(`productData: ${JSON.stringify(productData)}`);
    const newItems = productData.map((item) => {
      let { name, instock } = item.attributes;
      return { name, instock };
    });
    const allItems = [...items, ...newItems];
    //console.log(allItems); // [{name: 'Apples', country: 'Italy', cost: 3, instock: 2}, {name: 'Oranges', country: 'Spain', cost: 4, instock: 1}, {name: 'Beans', country: 'USA', cost: 2, instock: 8}, {name: 'Cabbage', country: 'USA', cost: 1, instock: 3}, {name: 'Apples', country: 'Italy', cost: 3, instock: 10}, {name: 'Oranges', country: 'Spain', cost: 4, instock: 3}, {name: 'Beans', country: 'USA', cost: 2, instock: 8}, {name: 'Cabbage', country: 'USA', cost: 1, instock: 8}]
    // Combine Duplicates
    let uniqueItems = [];
    allItems.forEach((item) => {
      if (uniqueItems.filter(e => e.name === item.name).length > 0) {
        // Sum stock of filtered uniqueItems with item already there
        const duplicateItem = uniqueItems.find(e => e.name === item.name);
        duplicateItem.instock += item.instock;
      } else {
        // Add the item to the unique array
        uniqueItems.push(item);
      }
    });
    setItems(uniqueItems);
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1>Product List</h1>
          <ul style={{ listStyleType: "none" }}>{list}</ul>
        </Col>
        <Col>
          <h1>Cart Contents</h1>
          <Accordion defaultActiveKey="0">{cartList}</Accordion>
        </Col>
        <Col>
          <h1>CheckOut </h1>
          <Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
      <Row>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            fetchRestockData();
          }}
        >
          <button type="submit">ReStock Products</button>
        </form>
      </Row>
    </Container>
  );
};

export default Products;