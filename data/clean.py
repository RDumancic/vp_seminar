import pandas as pd

df = pd.read_csv("master/master.csv")

df = df.drop(columns=["generation","HDI for year","population", "gdp_per_capita ($)", "suicides/100k pop"," gdp_for_year ($) "])
df = df.rename(columns={"suicides_no": "suicides"})

total_suicides = df.groupby(["country-year","country","year"], as_index = False)["suicides"].sum()
gender_suicides = df.groupby(["country-year", "sex"], as_index = False)["suicides"].sum()
female_suicides = gender_suicides.query('sex == "female"').reset_index()
male_suicides = gender_suicides.query('sex == "male"').reset_index()

total_suicides["male"] = male_suicides["suicides"]
total_suicides["female"] = female_suicides["suicides"]
total_suicides = total_suicides.drop(columns="country-year")

print(total_suicides)
total_suicides.to_csv("master/master-clean.csv", index=False)

# The generated .csv is made into json using: https://csvjson.com/csv2json