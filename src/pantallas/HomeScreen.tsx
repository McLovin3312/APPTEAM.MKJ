import { Button, StyleSheet, View } from 'react-native'
import React from 'react'

export default function HomeScreen({navigation}: any ) {
  return (
    <View>
        <Button title='Ejemplo Text' onPress={() => navigation.navigate('Text')}/>
        <Button title='Ejemplo Input' onPress={() => navigation.navigate('Input')}/>
        <Button title='Ejemplo Button' onPress={() => navigation.navigate('Button')}/>
        <Button title='Ejemplo List' onPress={() => navigation.navigate('List')}/>
        <Button title='Ejemplo Modal' onPress={() => navigation.navigate('Modal')}/>
    </View>
  )
}

const styles = StyleSheet.create({})