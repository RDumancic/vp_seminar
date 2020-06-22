import pandas as pd

df = pd.read_csv("master/master.csv")
df = df.rename(columns={"suicides_no": "suicides"})

total_suicides = df.groupby(["country-year","country","year"], as_index = False)["suicides"].sum()
population = df.groupby("country-year", as_index = False)["population"].sum()
gender_suicides = df.groupby(["country-year", "sex"], as_index = False)["suicides"].sum()
female_suicides = gender_suicides.query('sex == "female"').reset_index()
male_suicides = gender_suicides.query('sex == "male"').reset_index()

total_suicides["male"] = male_suicides["suicides"]
total_suicides["female"] = female_suicides["suicides"]
total_suicides["population"] = population["population"]

# calculating suicide rate per 100k pop
suicide_rate = (total_suicides["suicides"] / total_suicides["population"]) * 100000
total_suicides["rate"] = suicide_rate

# find the max num of suicides (used in app.js as legend max)
print(total_suicides.loc[total_suicides["suicides"].idxmax()])
total_suicides = total_suicides.drop(columns="country-year")

# find the highest suicide rate (used in app.js as legend max)
print(total_suicides.loc[total_suicides["rate"].idxmax()])
total_suicides.to_csv("master/master-clean.csv", index=False)

# The generated .csv is made into json using: https://csvjson.com/csv2json