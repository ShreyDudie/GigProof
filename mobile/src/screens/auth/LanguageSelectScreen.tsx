import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { changeLanguage } from '../../utils/i18n';
import { useTranslation } from 'react-i18next';

type LanguageSelectScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'LanguageSelect'>;

const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
];

export default function LanguageSelectScreen() {
  const navigation = useNavigation<LanguageSelectScreenNavigationProp>();
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLanguageSelect = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    await changeLanguage(languageCode);
  };

  const handleContinue = () => {
    navigation.navigate('PhoneEntry');
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-center mb-8 text-gray-800">
          Choose Your Language
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-4">
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                onPress={() => handleLanguageSelect(language.code)}
                className={`p-4 rounded-lg border-2 ${
                  selectedLanguage === language.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-4">{language.flag}</Text>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800">
                      {language.name}
                    </Text>
                    <Text className="text-base text-gray-600">
                      {language.native}
                    </Text>
                  </View>
                  {selectedLanguage === language.code && (
                    <Text className="text-blue-500 text-xl">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          onPress={handleContinue}
          className="mt-8 bg-blue-500 py-4 rounded-lg"
        >
          <Text className="text-white text-center text-lg font-semibold">
            {t('common.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}